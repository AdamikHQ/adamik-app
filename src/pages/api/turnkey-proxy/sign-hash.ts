import { NextApiRequest, NextApiResponse } from "next";
import { Turnkey } from "@turnkey/sdk-server";
import { handleApiError, formatSignature } from "~/utils/api/signerProxyUtils";

// Helper function to extract signature in the right format
function extractSignature(
  signatureFormat: string,
  signature: { r: string; s: string; v?: string }
): string {
  const sanitizedSignature = {
    r: signature.r.replace("0x", ""),
    s: signature.s.replace("0x", ""),
    v: signature.v?.replace("0x", ""),
  };

  if (signatureFormat === "rs") {
    return sanitizedSignature.r + sanitizedSignature.s;
  } else if (signatureFormat === "rsv") {
    return sanitizedSignature.r + sanitizedSignature.s + (sanitizedSignature.v || "");
  } else {
    throw new Error(`Unsupported signature format: ${signatureFormat}`);
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
    const { chainId, hash, pubKey, signerSpec } = req.body;

    console.log("Turnkey sign-hash request:", {
      chainId,
      pubKey,
      curve: signerSpec.curve,
      hashLength: hash.length,
      signatureFormat: signerSpec.signatureFormat,
    });

    // Validate environment variables
    if (!process.env.TURNKEY_BASE_URL) {
      throw new Error("TURNKEY_BASE_URL is not configured");
    }
    if (!process.env.TURNKEY_API_PUBLIC_KEY) {
      throw new Error("TURNKEY_API_PUBLIC_KEY is not configured");
    }
    if (!process.env.TURNKEY_API_PRIVATE_KEY) {
      throw new Error("TURNKEY_API_PRIVATE_KEY is not configured");
    }
    if (!process.env.TURNKEY_ORGANIZATION_ID) {
      throw new Error("TURNKEY_ORGANIZATION_ID is not configured");
    }

    // Initialize Turnkey client
    const turnkeyClient = new Turnkey({
      apiBaseUrl: process.env.TURNKEY_BASE_URL,
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY,
      defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID,
    });

    // For hash signing, we use NO_OP hash function since the hash is already computed
    // For Ed25519, we use NOT_APPLICABLE
    const hashFunction = signerSpec.curve === "ed25519"
      ? "HASH_FUNCTION_NOT_APPLICABLE"
      : "HASH_FUNCTION_NO_OP";
    
    console.log("Signing hash with Turnkey:", {
      signWith: pubKey,
      hashFunction,
      hashLength: hash.length,
    });

    // Sign the hash
    const txSignResult = await turnkeyClient.apiClient().signRawPayload({
      signWith: pubKey,
      payload: hash,
      encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
      hashFunction,
    });

    console.log("Turnkey hash signature result:", {
      r: txSignResult.r,
      s: txSignResult.s,
      v: txSignResult.v,
    });

    // Extract signature in the correct format
    const signature = extractSignature(signerSpec.signatureFormat, txSignResult);
    
    // Apply final formatting based on chain requirements
    const formattedSignature = formatSignature(signature, signerSpec.signatureFormat, chainId);

    console.log("Final formatted hash signature:", {
      format: signerSpec.signatureFormat,
      signature: formattedSignature.substring(0, 20) + "...",
    });

    return res.status(200).json({ signature: formattedSignature });
  } catch (error: any) {
    console.error("Turnkey sign-hash error:", error);
    handleApiError(res, error, "Turnkey sign-hash");
  }
}