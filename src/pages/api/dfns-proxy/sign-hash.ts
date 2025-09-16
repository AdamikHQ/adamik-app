import { NextApiRequest, NextApiResponse } from "next";
import { DfnsApiClient } from "@dfns/sdk";
import { AsymmetricKeySigner } from "@dfns/sdk-keysigner";
import { formatSignature } from "~/utils/api/signerProxyUtils";

// Helper function to format hash with 0x prefix
function formatHash(hash: string): string {
  return hash.startsWith("0x") ? hash : "0x" + hash;
}

// Helper for Starknet message validation
function checkStarknetMessage(msgHash: string): string {
  const MAX_VALUE = BigInt("0x800000000000000000000000000000000000000000000000000000000000000");
  
  // Remove 0x prefix if present
  const cleanHash = msgHash.replace(/^0x/i, "");
  
  // Convert to BigInt for validation
  const num = BigInt("0x" + cleanHash);
  
  if (num >= MAX_VALUE) {
    throw new Error(`msgHash should be less than ${MAX_VALUE.toString(16)}`);
  }
  
  return cleanHash;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { walletId, hash, signerSpec } = req.body;

    if (!walletId || !hash || !signerSpec) {
      return res.status(400).json({ 
        error: "Missing required parameters: walletId, hash, or signerSpec" 
      });
    }

    // Check required environment variables
    if (!process.env.DFNS_CRED_ID) {
      throw new Error("DFNS_CRED_ID is not configured");
    }
    if (!process.env.DFNS_PRIVATE_KEY) {
      throw new Error("DFNS_PRIVATE_KEY is not configured");
    }
    if (!process.env.DFNS_APP_ID) {
      throw new Error("DFNS_APP_ID is not configured");
    }
    if (!process.env.DFNS_AUTH_TOKEN) {
      throw new Error("DFNS_AUTH_TOKEN is not configured");
    }
    if (!process.env.DFNS_API_URL) {
      throw new Error("DFNS_API_URL is not configured");
    }

    // Create DFNS client
    const signer = new AsymmetricKeySigner({
      credId: process.env.DFNS_CRED_ID,
      privateKey: process.env.DFNS_PRIVATE_KEY,
    });

    const dfnsApi = new DfnsApiClient({
      authToken: process.env.DFNS_AUTH_TOKEN,
      baseUrl: process.env.DFNS_API_URL,
      appId: process.env.DFNS_APP_ID || "",
      signer,
    } as any);

    console.log("DFNS signing hash for wallet:", walletId);
    console.log("Hash to sign:", hash);
    console.log("Signer spec:", signerSpec);

    // Prepare the hash based on curve type
    let toSign: string;

    if (signerSpec.curve === "stark") {
      // For Starknet, validate and format the hash
      toSign = checkStarknetMessage(hash);
      toSign = formatHash(toSign);
    } else {
      // For other curves, ensure 0x prefix
      toSign = formatHash(hash);
    }

    console.log("Formatted hash to sign:", toSign);

    // Generate signature
    let signature;
    
    if (signerSpec.curve === "ed25519") {
      // For Ed25519, use Message signing with the pre-computed hash
      signature = await dfnsApi.wallets.generateSignature({
        body: {
          kind: "Message",
          message: toSign,
        },
        walletId,
      });
    } else {
      // For other curves, use Hash signing
      signature = await dfnsApi.wallets.generateSignature({
        body: {
          kind: "Hash",
          hash: toSign,
        },
        walletId,
      });
    }

    console.log("DFNS signature response:", signature);

    if (signature.status !== "Signed") {
      throw new Error(`Failed to sign hash: ${signature.reason}`);
    }

    // Format the signature according to the required format
    const formattedSignature = formatSignature(signerSpec.formatSignature, JSON.stringify({
      r: signature.signature?.r || "",
      s: signature.signature?.s || "",
      v: signature.signature?.recid,
    }));

    console.log("Formatted signature:", formattedSignature);

    return res.status(200).json({
      success: true,
      signature: formattedSignature,
    });
  } catch (error) {
    console.error("DFNS sign hash error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign hash with DFNS",
    });
  }
}