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
 */
export function formatSignature(
  signature: any,
  signatureFormat?: string,
  chainId?: string
): string {
  // Handle Ed25519 signatures
  if (typeof signature === "string") {
    return signature;
  }
  
  if ("signature" in signature) {
    return signature.signature;
  }
  
  // Handle ECDSA signatures with r, s, v components
  if ("r" in signature && "s" in signature) {
    // Remove 0x prefix if present
    const r = signature.r.replace(/^0x/, "");
    const s = signature.s.replace(/^0x/, "");
    
    switch (signatureFormat) {
      case "der":
        return signature.der || `${r}${s}`;
        
      case "rsv":
        // Ethereum-style signature with recovery byte
        const v = signature.v ? signature.v.toString(16).padStart(2, "0") : "";
        return `0x${r}${s}${v}`;
        
      case "rs":
        // Just r and s components
        return `0x${r}${s}`;
        
      default:
        // Default format based on chain
        if (chainId && ["ethereum", "base", "arbitrum", "polygon"].includes(chainId)) {
          const v = signature.v ? signature.v.toString(16).padStart(2, "0") : "";
          return `0x${r}${s}${v}`;
        }
        return `0x${r}${s}`;
    }
  }
  
  // Handle base64 signatures (IoFinnet format)
  if (signatureFormat === "hex" && typeof signature === "string") {
    // Check if it's base64
    if (!signature.startsWith("0x") && /^[A-Za-z0-9+/=]+$/.test(signature)) {
      const buffer = Buffer.from(signature, "base64");
      return "0x" + buffer.toString("hex");
    }
  }
  
  // Fallback: return as-is or stringify
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
 * Determine COSE algorithm for IoFinnet based on chain
 */
export function getCoseAlgorithm(chainId: string): string {
  // EVM chains use ECDSA with Keccak-256
  const evmChains = ["ethereum", "base", "optimism", "arbitrum", "polygon", "bsc", "avalanche"];
  if (evmChains.includes(chainId)) {
    return "ESKEC256";
  }
  
  // Bitcoin family uses ECDSA with SHA-256
  if (chainId.includes("bitcoin") || chainId === "dogecoin" || chainId === "litecoin") {
    return "ES256K";
  }
  
  // Ed25519 chains
  const ed25519Chains = ["algorand", "solana", "stellar"];
  if (ed25519Chains.includes(chainId)) {
    return "EdDSA";
  }
  
  // Default
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