import type { NextApiRequest, NextApiResponse } from "next";
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

    // Get COSE algorithm using shared utility
    const coseAlgorithm = getCoseAlgorithm(chain);

    // Create signature request
    const signatureRequest = {
      vaultId: vaultId,
      data: message,
      coseAlgorithm: coseAlgorithm,
      memo: `Sign ${chain} transaction`,
    };

    const signResponse = await fetch(`${baseUrl}/v1/signatures`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signatureRequest),
    });

    if (!signResponse.ok) {
      const errorText = await signResponse.text();
      console.error("IoFinnet signature request failed:", errorText);
      throw new Error("Failed to create signature request");
    }

    const signData = await signResponse.json();
    const signatureId = signData.id;

    // Poll for signature completion (from adamik-link pattern)
    let attempts = 0;
    let signature = null;

    while (attempts < SIGNATURE_POLL_MAX_ATTEMPTS && !signature) {
      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, SIGNATURE_POLL_INTERVAL_MS));
      attempts++;

      const statusResponse = await fetch(
        `${baseUrl}/v1/signatures/${signatureId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!statusResponse.ok) {
        console.error("Failed to get signature status");
        continue;
      }

      const statusData = await statusResponse.json();

      if (statusData.status === "COMPLETED" && statusData.signingData?.signature) {
        signature = statusData.signingData.signature;
        break;
      } else if (statusData.status === "REJECTED" || statusData.status === "EXPIRED") {
        throw new Error(`Signature ${statusData.status}: ${statusData.errorMessage || "Unknown error"}`);
      }

      // Log progress
      console.log(`[IoFinnet] Signature ${signatureId} status: ${statusData.status} (attempt ${attempts}/${SIGNATURE_POLL_MAX_ATTEMPTS})`);
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