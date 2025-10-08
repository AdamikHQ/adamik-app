import type { NextApiRequest, NextApiResponse } from "next";

// Extend API route timeout to 5 minutes for IoFinnet signatures
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: false,
    // Set timeout to 5 minutes (300 seconds) - Vercel Pro plan limit
    externalResolver: true,
  },
  maxDuration: 300, // Vercel serverless function timeout (max for Pro plan)
};
import { AdamikSignerSpec } from "~/utils/types";
import {
  handleApiError,
  formatSignature,
  getCoseAlgorithm,
  successResponse,
} from "~/utils/api/signerProxyUtils";
import { getIoFinnetConfig } from "~/utils/api/signerConfig";

/**
 * SIGNER-AGNOSTIC API proxy for IoFinnet transaction signing
 * Leverages the battle-tested implementation from adamik-link
 */

// IoFinnet signature polling configuration (from adamik-link)
const SIGNATURE_POLL_MAX_ATTEMPTS = 60; // 10 minutes max
const SIGNATURE_POLL_INTERVAL_MS = 10000; // 10 seconds

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { chain, message, signerSpec } = req.body;

  if (!chain || !message || !signerSpec) {
    return res.status(400).json({ 
      message: "Missing required parameters",
      error: "INVALID_REQUEST" 
    });
  }

  try {
    // Get IoFinnet configuration using shared utility
    const iofinnetConfig = getIoFinnetConfig();
    if (!iofinnetConfig) {
      return handleApiError(
        res,
        new Error("IoFinnet is not configured"),
        "Configuration error",
        503
      );
    }
    
    const { baseUrl, clientId, clientSecret, vaultId } = iofinnetConfig;

    // Authenticate
    const authResponse = await fetch(`${baseUrl}/v1/auth/accessToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        clientId: clientId,
        clientSecret: clientSecret,
      }),
    });

    if (!authResponse.ok) {
      throw new Error("Failed to authenticate with IoFinnet");
    }

    const authData = await authResponse.json();
    const accessToken = authData.accessToken;

    // Get COSE algorithm from signerSpec (curve and hash function)
    const coseAlgorithm = getCoseAlgorithm(signerSpec);

    // Remove 0x prefix if present for IoFinnet
    let cleanData = message.startsWith("0x") ? message.slice(2) : message;
    
    // CRITICAL: Stellar Transaction Signing
    // For Stellar (Ed25519/EDDSA), we receive and sign the pre-computed hash from Adamik
    // Why: EDDSA algorithm does NOT pre-hash the input data before signing
    // What Stellar expects: Signature over SHA256(NetworkID + EnvelopeType + XDR)
    // What we receive: The 32-byte hash from Adamik's encode response (hash.value)
    // What IoFinnet does: Signs this hash directly with Ed25519 (no additional hashing)
    // This matches Sodot's behavior exactly

    // Create signature request following adamik-link pattern
    const signatureRequest = {
      data: cleanData,
      coseAlgorithm: coseAlgorithm,
      contentType: "application/octet-stream+hex",
      memo: `Sign ${chain} transaction`,
    };


    // Use the correct endpoint with vault ID in path (as per adamik-link)
    const signResponse = await fetch(`${baseUrl}/v1/vaults/${vaultId}/signatures/sign`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(signatureRequest),
    });

    if (!signResponse.ok) {
      const errorText = await signResponse.text();
      throw new Error(`Failed to create signature request: ${errorText}`);
    }

    const signData = await signResponse.json();
    const signatureId = signData.signatureId || signData.id; // Handle both field names
    

    // Poll for signature completion (from adamik-link pattern)
    let attempts = 0;
    let signature = null;
    

    while (attempts < SIGNATURE_POLL_MAX_ATTEMPTS && !signature) {
      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, SIGNATURE_POLL_INTERVAL_MS));
      attempts++;

      // Use correct endpoint with vault ID in path
      const statusResponse = await fetch(
        `${baseUrl}/v1/vaults/${vaultId}/signatures/${signatureId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!statusResponse.ok) {
        // Continue polling if status check fails
        continue;
      }

      const statusData = await statusResponse.json();

      if (statusData.status === "COMPLETED" && statusData.signingData?.signature) {
        signature = statusData.signingData.signature;
        break;
      } else if (statusData.status === "REJECTED" || statusData.status === "EXPIRED" || statusData.status === "FAILED" || statusData.status === "CANCELLED") {
        const errorMsg = `Signature ${statusData.status}: ${statusData.errorMessage || statusData.errorCode || "Unknown error"}`;
        throw new Error(errorMsg);
      }

    }

    if (!signature) {
      throw new Error("Signature timeout - no response after 10 minutes");
    }


    
    // Format signature using shared utility
    const formattedSignature = formatSignature(
      signature,
      signerSpec.signatureFormat,
      chain
    );

    // Return success response using shared utility
    return successResponse(res, {
      signature: formattedSignature,
      signatureId: signatureId,
    });
  } catch (error: any) {
    return handleApiError(res, error, "IoFinnet sign-transaction", 500);
  }
}