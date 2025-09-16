import { NextApiRequest, NextApiResponse } from "next";
import { DfnsApiClient } from "@dfns/sdk";
import { AsymmetricKeySigner } from "@dfns/sdk-keysigner";
import { ethers } from "ethers";
import { formatSignature } from "~/utils/api/signerProxyUtils";

// Helper function to format hash with 0x prefix
function formatHash(hash: string): string {
  return hash.startsWith("0x") ? hash : "0x" + hash;
}

// Helper function for Keccak256 hashing
function keccak256FromHex(hexString: string): string {
  if (!hexString.startsWith("0x")) {
    hexString = "0x" + hexString;
  }
  const bytes = ethers.getBytes(hexString);
  const hash = ethers.keccak256(bytes);
  return hash;
}

// Helper function for SHA256 hashing
function sha256FromHex(hexString: string): string {
  const bytes = Buffer.from(hexString.replace(/^0x/i, ""), "hex");
  const hash = ethers.sha256(bytes);
  return hash;
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
    const { walletId, encodedMessage, signerSpec } = req.body;

    if (!walletId || !encodedMessage || !signerSpec) {
      return res.status(400).json({ 
        error: "Missing required parameters: walletId, encodedMessage, or signerSpec" 
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

    console.log("DFNS signing transaction for wallet:", walletId);
    console.log("Signer spec:", signerSpec);

    // Prepare the message to sign based on curve and hash function
    let toSign: string;

    if (signerSpec.curve === "stark") {
      // For Starknet, validate and format the message
      toSign = checkStarknetMessage(encodedMessage);
      toSign = formatHash(toSign);
    } else if (signerSpec.curve === "ed25519") {
      // For Ed25519, use the message directly (it's already hashed by Adamik)
      toSign = encodedMessage;
    } else if (signerSpec.curve === "secp256k1") {
      // For secp256k1, apply hash function based on chain
      if (signerSpec.hashFunction === "sha256") {
        toSign = sha256FromHex(encodedMessage);
      } else if (signerSpec.hashFunction === "keccak256") {
        toSign = keccak256FromHex(encodedMessage);
      } else {
        // If no hash function specified, use the message as-is
        toSign = formatHash(encodedMessage);
      }
    } else {
      toSign = formatHash(encodedMessage);
    }

    console.log("Message to sign:", toSign);

    // Generate signature based on curve type
    let signature;
    
    if (signerSpec.curve === "ed25519") {
      // For Ed25519, use Message signing
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
      throw new Error(`Failed to sign transaction: ${signature.reason}`);
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
    console.error("DFNS sign transaction error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign with DFNS",
    });
  }
}