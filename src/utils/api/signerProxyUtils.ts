/**
 * SIGNER-AGNOSTIC utility functions for API proxy endpoints
 * Centralizes common logic used across all signer proxies
 */

import { NextApiResponse } from "next";
import { getChains } from "~/api/adamik/chains";
import { Chain } from "~/utils/types";

// Cache for chain configurations
let cachedChains: Record<string, Chain> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get chain configuration with caching
 */
export async function getChainConfig(chainId?: string) {
  const now = Date.now();
  
  // Refresh cache if expired or missing
  if (!cachedChains || now - cacheTimestamp > CACHE_DURATION_MS) {
    cachedChains = await getChains();
    cacheTimestamp = now;
  }
  
  if (!cachedChains) {
    throw new Error("Failed to fetch chain configurations");
  }
  
  // Return specific chain or all chains
  if (chainId) {
    const chain = cachedChains[chainId];
    if (!chain) {
      throw new Error(`Chain '${chainId}' not supported`);
    }
    return chain;
  }
  
  return cachedChains;
}

/**
 * Format signature based on chain requirements and format type
 * Handles different signature formats (rs, rsv, der) and lengths
 * Special handling for Ed25519 signatures which may have extra bytes
 */
export function formatSignature(
  signature: any,
  signatureFormat?: string,
  chainId?: string
): string {
  if (typeof signature === "string") {
    let cleanSig = signature.replace(/^0x/i, "");
    
    if (/[+/=]/.test(cleanSig) || /[g-z]/i.test(cleanSig)) {
      const buffer = Buffer.from(cleanSig, "base64");
      cleanSig = buffer.toString("hex");
    }
    
    const sigLengthBytes = cleanSig.length / 2;
    
    // For Ed25519 signatures (used by Stellar, Algorand, Solana), 
    // IoFinnet may return 65 or 66 bytes with extra metadata at the end.
    // We need to take only the first 64 bytes for the actual signature.
    if (signatureFormat === "rs") {
      // RS format expects exactly 64 bytes (128 hex chars)
      if (sigLengthBytes === 64) {
        return cleanSig;
      } else if (sigLengthBytes === 65 || sigLengthBytes === 66) {
        // IoFinnet returns 65-66 bytes for Ed25519, take only the first 64
        return cleanSig.slice(0, 128);
      } else if (sigLengthBytes >= 32) {
        // For other cases, try to extract r and s (32 bytes each)
        const r = cleanSig.slice(0, 64);
        const s = cleanSig.slice(64, 128);
        return r + s;
      }
    } else if (signatureFormat === "rsv") {
      if (sigLengthBytes === 65) {
        return cleanSig;
      } else if (sigLengthBytes === 66) {
        const v = cleanSig.slice(128, 130);
        const r = cleanSig.slice(0, 64);
        const s = cleanSig.slice(64, 128);
        return r + s + v;
      }
    }
    
    // Default: return cleaned signature as-is
    
    return cleanSig;
  }
  
  if (signature && typeof signature === "object") {
    if ("signature" in signature) {
      return signature.signature;
    }
    
    if ("r" in signature && "s" in signature) {
      const r = signature.r.replace(/^0x/, "");
      const s = signature.s.replace(/^0x/, "");
      
      switch (signatureFormat) {
        case "der":
          return signature.der || `${r}${s}`;
          
        case "rsv":
          const v = signature.v ? signature.v.toString(16).padStart(2, "0") : "";
          return `0x${r}${s}${v}`;
          
        case "rs":
          // RS format (used by Cosmos) should NOT have 0x prefix
          return `${r}${s}`;
          
        default:
          if (chainId && ["ethereum", "base", "arbitrum", "polygon", "optimism"].includes(chainId)) {
            const v = signature.v ? signature.v.toString(16).padStart(2, "0") : "";
            return `0x${r}${s}${v}`;
          }
          // Default for unknown formats - no 0x prefix for RS-like signatures
          return `${r}${s}`;
      }
    }
  }
  
  if (typeof signature === "object") {
    return JSON.stringify(signature);
  }
  
  return signature;
}

/**
 * Standardized error response handler
 */
export function handleApiError(
  res: NextApiResponse,
  error: any,
  context: string,
  statusCode: number = 500
) {
  console.error(`[${context}] Error:`, error);
  
  // Extract error message
  let message = "An unknown error occurred";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (error?.message) {
    message = error.message;
  }
  
  return res.status(statusCode).json({
    success: false,
    error: context,
    message: message,
    ...(process.env.NODE_ENV === "development" && { 
      stack: error?.stack,
      details: error 
    })
  });
}

/**
 * Validate that required environment variables are set
 */
export function validateEnvVars(required: string[]): {
  valid: boolean;
  missing: string[];
} {
  const missing = required.filter(varName => !process.env[varName]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Get curve type for a chain (ECDSA vs EdDSA)
 */
export function getCurveTypeForChain(chainConfig: Chain): "ecdsa" | "ed25519" {
  // Check the signerSpec curve field
  if (chainConfig.signerSpec.curve === "ed25519") {
    return "ed25519";
  }
  
  return "ecdsa"; // Default for secp256k1
}

/**
 * Get COSE algorithm for IoFinnet based on curve and hash from signerSpec
 * EDDSA: Ed25519 signatures (no pre-hashing)
 * ES256K: ECDSA with SHA-256 (Bitcoin-style)
 * ESKEC256: ECDSA with Keccak-256 (Ethereum-style)
 */
export function getCoseAlgorithm(signerSpec: { curve: string; hashFunction: string }): string {
  // Ed25519 curve uses EDDSA (IoFinnet expects all caps)
  if (signerSpec.curve === "ed25519") {
    return "EDDSA";
  }
  
  // For secp256k1 (ECDSA), the hash function matters
  if (signerSpec.curve === "secp256k1") {
    if (signerSpec.hashFunction === "keccak256") {
      // Ethereum-style: ECDSA with Keccak-256
      return "ESKEC256";
    } else if (signerSpec.hashFunction === "sha256") {
      // Bitcoin-style: ECDSA with SHA-256
      return "ES256K";
    }
  }
  
  // Default fallback
  console.warn(`Unknown curve/hash combination: ${signerSpec.curve}/${signerSpec.hashFunction}`);
  return "ES256K";
}

/**
 * Build derivation path based on BIP-44 standard
 */
export function buildDerivationPath(coinType: string | number): number[] {
  const coinTypeNum = typeof coinType === "string" ? parseInt(coinType) : coinType;
  return [44, coinTypeNum, 0, 0, 0];
}

/**
 * Format response for successful operations
 */
export function successResponse(
  res: NextApiResponse,
  data: any,
  metadata?: Record<string, any>
) {
  return res.status(200).json({
    success: true,
    ...data,
    ...metadata
  });
}