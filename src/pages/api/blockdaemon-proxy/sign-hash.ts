import { NextApiRequest, NextApiResponse } from "next";
import { handleApiError, formatSignature } from "~/utils/api/signerProxyUtils";
import https from "https";
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { chainId, hash, keyId, curve, signatureFormat, signerSpec } = req.body;

    // Extract values from signerSpec if individual fields aren't provided
    const actualCurve = curve || signerSpec?.curve;
    const actualSignatureFormat = signatureFormat || signerSpec?.signatureFormat;

    console.log("BlockDaemon sign-hash request:", { 
      chainId, 
      keyId, 
      curve: actualCurve, 
      signatureFormat: actualSignatureFormat,
      hashLength: hash?.length 
    });

    const actualKeyId = keyId || process.env.BLOCKDAEMON_KEY_ID || process.env.BLOCKDAEMON_EXISTING_KEY_IDS;
    if (!actualKeyId) {
      return res.status(400).json({ 
        error: "No key ID provided. Generate a key first." 
      });
    }

    // The code below would work if we had access to the TSM signing endpoint
    // Remove 0x prefix if present
    const cleanHash = hash.replace(/^0x/, "");

    console.log("Signing hash with BlockDaemon TSM...");

    // Create signing request for pre-computed hash
    const signRequest = {
      keyId: actualKeyId,
      message: cleanHash,
      hashAlgorithm: "none", // Hash is already computed
    };

    const signResult = await makeTSMRequest("/sign", "POST", signRequest);

    console.log("TSM signature received:", {
      r: signResult.r,
      s: signResult.s,
    });

    // Format signature based on required format
    let formattedSignature: string;
    
    if (actualSignatureFormat === "rsv") {
      // For RSV format, we would need the public key to calculate recovery ID
      // For now, use recovery ID 0 as default
      formattedSignature = formatSignature(
        {
          r: signResult.r,
          s: signResult.s,
          v: "0",
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
    console.error("BlockDaemon sign-hash error:", error);
    return handleApiError(res, error, "blockdaemon");
  }
}