import { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env";
import {
  getChainConfig,
  formatSignature,
  handleApiError,
  getCurveTypeForChain,
  buildDerivationPath,
  successResponse,
} from "~/utils/api/signerProxyUtils";
import { getSodotVertexConfig, getSodotKeyIds } from "~/utils/api/signerConfig";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        status: 405,
        error: "Method not allowed",
        message: "Only POST requests are supported",
      });
    }

    // Extract chain from URL and transaction from body
    const { chain } = req.query;
    const { transaction, hash, usePrecomputedHash } = req.body;

    if (!chain || typeof chain !== "string") {
      return res.status(400).json({
        status: 400,
        error: "Missing chain parameter",
        message: "Chain parameter is required",
      });
    }

    if (!transaction && !hash) {
      return res.status(400).json({
        status: 400,
        error: "Missing transaction data",
        message: "Either transaction or hash is required in the request body",
      });
    }

    // Get chain configuration using shared utility
    let chainConfig;
    try {
      chainConfig = await getChainConfig(chain);
    } catch (error: any) {
      return handleApiError(res, error, "Invalid chain", 400);
    }

    // Get curve type using shared utility
    const curveType = getCurveTypeForChain(chainConfig);

    // Determine what to sign based on curve type and available data
    let messageToSign;

    if (usePrecomputedHash && hash) {
      // When using pre-computed hash, use it for both ECDSA and Ed25519
      messageToSign = hash;
    } else if (transaction) {
      // Otherwise, use the raw transaction if available
      messageToSign = transaction;
    } else {
      // No valid message to sign
      return res.status(400).json({
        status: 400,
        error: "Invalid request",
        message: "Either transaction or hash must be provided",
      });
    }

    // Format as needed (removing 0x prefix if present)
    if (typeof messageToSign === "string" && messageToSign.startsWith("0x")) {
      messageToSign = messageToSign.substring(2);
    }

    // Get key IDs using shared utility
    const keyIds = getSodotKeyIds(curveType);
    if (keyIds.length < 3) {
      return handleApiError(
        res,
        new Error(`Insufficient key IDs: found ${keyIds.length}, need 3`),
        "Configuration error",
        500
      );
    }

    // Build derivation path using shared utility
    const derivationPath = buildDerivationPath(chainConfig.signerSpec.coinType);

    // Step 1: Create a signing room
    const createRoomResponse = await fetch(
      `${env.SODOT_VERTEX_URL_0}/create-room`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.SODOT_VERTEX_API_KEY_0,
        },
        body: JSON.stringify({
          room_size: 3, // We have 3 vertices
        }),
      }
    );

    if (!createRoomResponse.ok) {
      const errorText = await createRoomResponse.text();
      return res.status(500).json({
        status: 500,
        error: "Failed to create signing room",
        message: `Error: ${errorText}`,
      });
    }

    const roomData = await createRoomResponse.json();
    const roomUuid = roomData.room_uuid;

    // Step 2: Sign the transaction with each vertex
    const signPromises = keyIds.map(async (keyId: string, index: number) => {
      // Get vertex configuration using shared utility
      const vertexConfig = getSodotVertexConfig(index);
      if (!vertexConfig) {
        throw new Error(`Missing configuration for vertex ${index}`);
      }
      
      const { url: vertexUrl, apiKey } = vertexConfig;

      // Customize the request body based on the curve type and if we're using a pre-computed hash
      const requestBody: any = {
        room_uuid: roomUuid,
        key_id: keyId,
        derivation_path: derivationPath,
      };

      // Different approach based on curve type
      if (curveType === "ecdsa") {
        if (usePrecomputedHash && hash) {
          // For ECDSA with pre-computed hash:
          // - Use "none" for hash_algo to indicate no additional hashing
          // - Provide the hash in the msg parameter
          requestBody.msg = messageToSign;
          requestBody.hash_algo = "none"; // Tell the API not to hash again
        } else {
          // If no pre-computed hash, let Sodot hash the message with the appropriate algorithm
          // Determine the hash algorithm from the chain configuration
          const hashAlgo = chainConfig.signerSpec?.hashFunction === "sha256" ? "sha256" : "keccak256";
          requestBody.msg = messageToSign;
          requestBody.hash_algo = hashAlgo; // Use chain-specific hash algorithm
        }
      } else {
        // For Ed25519, just provide the message directly (no hash_algo)
        if (!messageToSign) {
          throw new Error("No message to sign for Ed25519");
        }
        requestBody.msg = messageToSign;
      }

      const response = await fetch(`${vertexUrl}/${curveType}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex ${index} signing failed: ${errorText}`);
      }

      return await response.json();
    });

    // Wait for all sign operations to complete
    const signResults = await Promise.all(signPromises);
    const signature = signResults[0]; // Use the first signature

    // Format signature using shared utility
    const formattedSignature = formatSignature(
      signature,
      chainConfig.signerSpec.signatureFormat,
      chain
    );

    // Return success response using shared utility
    return successResponse(res, {
      signature: formattedSignature,
      chainId: chain,
      curve: curveType,
      usedPrecomputedHash: curveType === "ecdsa" && usePrecomputedHash && !!hash,
    });
  } catch (error: any) {
    return handleApiError(res, error, "Failed to sign transaction", 500);
  }
}
