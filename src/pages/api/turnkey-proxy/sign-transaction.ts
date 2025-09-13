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
    const { chainId, encodedMessage, pubKey, signerSpec } = req.body;

    console.log("Turnkey sign-transaction request:", {
      chainId,
      pubKey,
      curve: signerSpec.curve,
      hashFunction: signerSpec.hashFunction,
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

    // Convert hash function to Turnkey format
    const convertHashFunction = (
      hashFunction: string,
      curve: string
    ): string => {
      if (curve === "ed25519") {
        return "HASH_FUNCTION_NOT_APPLICABLE";
      }

      // https://docs.turnkey.com/faq#what-does-hash_function_no_op-mean
      switch (hashFunction) {
        case "sha256":
          return "HASH_FUNCTION_SHA256";
        case "keccak256":
          return "HASH_FUNCTION_KECCAK256";
        default:
          return "HASH_FUNCTION_NOT_APPLICABLE";
      }
    };

    const hashFunction = convertHashFunction(signerSpec.hashFunction, signerSpec.curve);
    
    console.log("Signing with Turnkey:", {
      signWith: pubKey,
      hashFunction,
      payloadLength: encodedMessage.length,
    });

    // Sign the transaction
    const txSignResult = await turnkeyClient.apiClient().signRawPayload({
      signWith: pubKey,
      payload: encodedMessage,
      encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
      hashFunction,
    });

    console.log("Turnkey signature result:", {
      r: txSignResult.r,
      s: txSignResult.s,
      v: txSignResult.v,
    });

    // Extract signature in the correct format
    const signature = extractSignature(signerSpec.signatureFormat, txSignResult);
    
    // Apply final formatting based on chain requirements
    const formattedSignature = formatSignature(signature, signerSpec.signatureFormat, chainId);

    console.log("Final formatted signature:", {
      format: signerSpec.signatureFormat,
      signature: formattedSignature.substring(0, 20) + "...",
    });

    return res.status(200).json({ signature: formattedSignature });
  } catch (error: any) {
    console.error("Turnkey sign-transaction error:", error);
    handleApiError(res, error, "Turnkey sign-transaction");
  }
}