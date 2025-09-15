import { NextApiRequest, NextApiResponse } from "next";
import { handleApiError, formatSignature } from "~/utils/api/signerProxyUtils";
import https from "https";
import crypto from "crypto";
import { secp256k1 } from "@noble/curves/secp256k1";

// Helper to make authenticated requests to BlockDaemon TSM
async function makeTSMRequest(
  path: string,
  method: string = "GET",
  body?: any
): Promise<any> {
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

  return new Promise((resolve, reject) => {
    const url = new URL(`${endpoint}${path}`);
    const postData = body ? JSON.stringify(body) : undefined;

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      cert,
      key,
      rejectUnauthorized: false, // TSM uses self-signed or internal CA certificates
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(postData && { "Content-Length": Buffer.byteLength(postData) }),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`TSM request failed: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Calculate recovery ID for signature
function calculateRecoveryId(
  messageHash: Buffer,
  signature: { r: string; s: string },
  publicKeyHex: string
): number {
  try {
    const pubKeyBytes = Buffer.from(publicKeyHex, "hex");
    const pubKeyPoint = (secp256k1 as any).ProjectivePoint.fromHex(pubKeyBytes);

    const sig = secp256k1.Signature.fromCompact(
      Buffer.concat([
        Buffer.from(signature.r.padStart(64, "0"), "hex"),
        Buffer.from(signature.s.padStart(64, "0"), "hex"),
      ])
    );

    // Try recovery IDs 0 and 1
    for (let recoveryId = 0; recoveryId < 2; recoveryId++) {
      try {
        const recoveredPoint = sig
          .addRecoveryBit(recoveryId)
          .recoverPublicKey(messageHash);

        if (recoveredPoint.equals(pubKeyPoint)) {
          return recoveryId;
        }
      } catch {
        continue;
      }
    }

    // Default to 0 if we can't determine
    return 0;
  } catch (error) {
    console.error("Failed to calculate recovery ID:", error);
    return 0;
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
    const { 
      chainId, 
      message,
      encodedMessage, // TransferTransactionForm sends encodedMessage 
      keyId, 
      curve, 
      hashFunction, 
      signatureFormat,
      signerSpec // TransferTransactionForm sends signerSpec object
    } = req.body;

    // Extract values from signerSpec if individual fields aren't provided
    const actualCurve = curve || signerSpec?.curve;
    const actualHashFunction = hashFunction || signerSpec?.hashFunction;
    const actualSignatureFormat = signatureFormat || signerSpec?.signatureFormat;
    const actualMessage = message || encodedMessage;

    console.log("BlockDaemon sign-transaction request:", { 
      chainId, 
      keyId, 
      curve: actualCurve, 
      hashFunction: actualHashFunction,
      signatureFormat: actualSignatureFormat,
      messageLength: actualMessage?.length 
    });

    // Validate required parameters
    if (!actualMessage) {
      return res.status(400).json({ 
        error: "No message provided for signing" 
      });
    }

    const actualKeyId = keyId || process.env.BLOCKDAEMON_KEY_ID || process.env.BLOCKDAEMON_EXISTING_KEY_IDS;
    if (!actualKeyId) {
      return res.status(400).json({ 
        error: "No key ID provided. Please connect wallet first to generate or retrieve a key." 
      });
    }

    // Remove 0x prefix if present
    const cleanMessage = actualMessage.replace(/^0x/, "");
    
    // Apply hash function if needed
    let messageToSign = cleanMessage;
    if (actualHashFunction && actualHashFunction !== "none") {
      const hashBuffer = Buffer.from(cleanMessage, "hex");
      let hashedMessage: Buffer;
      
      switch (actualHashFunction) {
        case "keccak256":
          hashedMessage = crypto.createHash("sha3-256").update(hashBuffer).digest();
          break;
        case "sha256":
          hashedMessage = crypto.createHash("sha256").update(hashBuffer).digest();
          break;
        default:
          hashedMessage = hashBuffer;
      }
      
      messageToSign = hashedMessage.toString("hex");
    }

    console.log("Signing with BlockDaemon TSM...");

    // Create signing request
    const signRequest = {
      keyId: actualKeyId,
      message: messageToSign,
      hashAlgorithm: "none", // We've already hashed if needed
    };

    const signResult = await makeTSMRequest("/sign", "POST", signRequest);

    console.log("TSM signature received:", {
      r: signResult.r,
      s: signResult.s,
    });

    // Format signature based on required format
    let formattedSignature: string;
    
    if (actualSignatureFormat === "rsv") {
      // Get public key to calculate recovery ID
      const keyInfo = await makeTSMRequest(`/keys/${actualKeyId}`);
      const publicKeyHex = convertTSMPublicKey(keyInfo.publicKey);
      
      const recoveryId = calculateRecoveryId(
        Buffer.from(messageToSign, "hex"),
        { r: signResult.r, s: signResult.s },
        publicKeyHex
      );

      formattedSignature = formatSignature(
        {
          r: signResult.r,
          s: signResult.s,
          v: recoveryId.toString(16),
        },
        actualSignatureFormat
      );
    } else {
      // RS format
      formattedSignature = formatSignature(
        {
          r: signResult.r,
          s: signResult.s,
        },
        actualSignatureFormat
      );
    }

    console.log("Formatted signature:", formattedSignature);

    return res.status(200).json({
      signature: formattedSignature,
    });
  } catch (error) {
    console.error("BlockDaemon sign-transaction error:", error);
    return handleApiError(res, error, "blockdaemon");
  }
}

// Convert TSM public key format to compressed hex (shared with get-pubkey)
function convertTSMPublicKey(tsmPublicKey: any): string {
  try {
    if (tsmPublicKey.scheme !== "ECDSA" || tsmPublicKey.curve !== "secp256k1") {
      throw new Error(`Unsupported key type: ${tsmPublicKey.scheme}/${tsmPublicKey.curve}`);
    }

    const pointBuffer = Buffer.from(tsmPublicKey.point, "base64");
    
    let fullKey: Uint8Array;
    if (pointBuffer.length === 64) {
      fullKey = new Uint8Array(65);
      fullKey[0] = 0x04;
      fullKey.set(pointBuffer, 1);
    } else if (pointBuffer.length === 65) {
      fullKey = pointBuffer;
    } else {
      throw new Error(`Invalid public key length: ${pointBuffer.length}`);
    }

    const point = (secp256k1 as any).ProjectivePoint.fromHex(fullKey);
    const compressedKey = point.toRawBytes(true);
    
    return Buffer.from(compressedKey).toString("hex");
  } catch (error) {
    console.error("Failed to convert TSM public key:", error);
    throw error;
  }
}