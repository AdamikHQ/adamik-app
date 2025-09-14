import { NextApiRequest, NextApiResponse } from "next";
import { handleApiError } from "~/utils/api/signerProxyUtils";
import https from "https";
import crypto from "crypto";
import { secp256k1 } from "@noble/curves/secp256k1";

// Helper to make authenticated requests to BlockDaemon TSM
async function makeTSMRequest(
  path: string,
  method: string = "GET",
  body?: any
) {
  const endpoint = process.env.BLOCKDAEMON_TSM_ENDPOINT;
  if (!endpoint) throw new Error("BLOCKDAEMON_TSM_ENDPOINT not configured");

  const cert = process.env.BLOCKDAEMON_CLIENT_CERT_CONTENT || 
              (process.env.BLOCKDAEMON_CLIENT_CERT_PATH ? 
                require('fs').readFileSync(process.env.BLOCKDAEMON_CLIENT_CERT_PATH, 'utf8') : 
                undefined);
  
  const key = process.env.BLOCKDAEMON_CLIENT_KEY_CONTENT || 
              (process.env.BLOCKDAEMON_CLIENT_KEY_PATH ? 
                require('fs').readFileSync(process.env.BLOCKDAEMON_CLIENT_KEY_PATH, 'utf8') : 
                undefined);

  if (!cert || !key) {
    throw new Error("BlockDaemon certificates not configured");
  }

  const agent = new https.Agent({
    cert,
    key,
    rejectUnauthorized: true,
  });

  const url = `${endpoint}${path}`;
  const options: any = {
    method,
    agent,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TSM request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

// Convert TSM public key format to compressed hex
function convertTSMPublicKey(tsmPublicKey: any): string {
  try {
    // TSM returns public key in a specific format
    // We need to convert it to compressed secp256k1 format
    if (tsmPublicKey.scheme !== "ECDSA" || tsmPublicKey.curve !== "secp256k1") {
      throw new Error(`Unsupported key type: ${tsmPublicKey.scheme}/${tsmPublicKey.curve}`);
    }

    // Decode the point from base64
    const pointBuffer = Buffer.from(tsmPublicKey.point, "base64");
    
    // Ensure it's in the right format (may need 0x04 prefix for uncompressed)
    let fullKey: Uint8Array;
    if (pointBuffer.length === 64) {
      // Add uncompressed prefix
      fullKey = new Uint8Array(65);
      fullKey[0] = 0x04;
      fullKey.set(pointBuffer, 1);
    } else if (pointBuffer.length === 65) {
      fullKey = pointBuffer;
    } else {
      throw new Error(`Invalid public key length: ${pointBuffer.length}`);
    }

    // Convert to compressed format using noble-curves
    const point = (secp256k1 as any).ProjectivePoint.fromHex(fullKey);
    const compressedKey = point.toRawBytes(true);
    
    return Buffer.from(compressedKey).toString("hex");
  } catch (error) {
    console.error("Failed to convert TSM public key:", error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { chainId, curve, keyId } = req.body;

    console.log("BlockDaemon get-pubkey request:", { chainId, curve, keyId });

    // Check if we have an existing key ID
    let actualKeyId = keyId || process.env.BLOCKDAEMON_KEY_ID;

    if (actualKeyId) {
      // Retrieve existing public key
      console.log("Retrieving existing key:", actualKeyId);
      
      const keyInfo = await makeTSMRequest(`/keys/${actualKeyId}`);
      const publicKey = convertTSMPublicKey(keyInfo.publicKey);
      
      return res.status(200).json({
        publicKey,
        keyId: actualKeyId,
      });
    } else {
      // Generate new key
      console.log("Generating new BlockDaemon TSM key...");
      
      // Key generation parameters
      const keyGenParams = {
        curve: curve === "ed25519" ? "ed25519" : "secp256k1",
        threshold: 2,  // 2-of-3 threshold
        keyShares: 3,  // Total shares
      };

      const keyGenResult = await makeTSMRequest("/keygen", "POST", keyGenParams);
      
      console.log("Key generated successfully:", keyGenResult.keyId);
      
      const publicKey = convertTSMPublicKey(keyGenResult.publicKey);
      
      // Store the key ID for future use
      console.log("IMPORTANT: Add this to your .env.local file:");
      console.log(`BLOCKDAEMON_KEY_ID=${keyGenResult.keyId}`);
      
      return res.status(200).json({
        publicKey,
        keyId: keyGenResult.keyId,
        message: "New key generated. Please save the keyId to your environment variables.",
      });
    }
  } catch (error) {
    console.error("BlockDaemon get-pubkey error:", error);
    return handleApiError(error, "blockdaemon");
  }
}