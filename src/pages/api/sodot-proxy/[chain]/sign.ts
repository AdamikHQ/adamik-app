import { NextApiRequest, NextApiResponse } from "next";
import { getChains } from "~/api/adamik/chains";
import { env } from "~/env";

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

    // Get chain configurations from Adamik API
    const chains = await getChains();

    if (!chains) {
      return res.status(500).json({
        status: 500,
        error: "Failed to fetch chain information",
        message: "Unable to retrieve chain configurations from Adamik API",
      });
    }

    // Find the requested chain
    const chainConfig = chains[chain];

    if (!chainConfig) {
      return res.status(400).json({
        status: 400,
        error: "Unsupported chain",
        message: `Chain '${chain}' is not supported. Use one of: ${Object.keys(
          chains
        ).join(", ")}`,
      });
    }

    // Get curve type from signerSpec
    const curveType =
      chainConfig.signerSpec.curve === "secp256k1" ? "ecdsa" : "ed25519";

    // Determine what to sign based on curve type and available data
    let messageToSign;

    if (usePrecomputedHash && hash) {
      // When using pre-computed hash, use it for both ECDSA and Ed25519
      console.log(`Using pre-computed hash for ${curveType} signing`);
      messageToSign = hash;
    } else if (transaction) {
      // Otherwise, use the raw transaction if available
      console.log(`Using raw transaction for ${curveType} signing`);
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

    // Get key IDs for this chain's curve
    let keyIdsStr: string | undefined;
    if (curveType === "ecdsa") {
      keyIdsStr = process.env.SODOT_EXISTING_ECDSA_KEY_IDS;
    } else {
      keyIdsStr = process.env.SODOT_EXISTING_ED25519_KEY_IDS;
    }

    if (!keyIdsStr) {
      return res.status(500).json({
        status: 500,
        error: "Missing key IDs",
        message: `No key IDs found for ${curveType} curve in environment variables`,
      });
    }

    const keyIds = keyIdsStr.split(",");
    if (keyIds.length < 3) {
      return res.status(500).json({
        status: 500,
        error: "Insufficient key IDs",
        message: `Found only ${keyIds.length} key IDs, need at least 3`,
      });
    }

    // Construct derivation path based on BIP-44 standard
    const coinType = parseInt(chainConfig.signerSpec.coinType);
    const derivationPath = [44, coinType, 0, 0, 0];

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
      // Get the vertex URL and API key
      let vertexUrl: string | undefined;
      let apiKey: string | undefined;

      if (index === 0) {
        vertexUrl = env.SODOT_VERTEX_URL_0;
        apiKey = env.SODOT_VERTEX_API_KEY_0;
      } else if (index === 1) {
        vertexUrl = env.SODOT_VERTEX_URL_1;
        apiKey = env.SODOT_VERTEX_API_KEY_1;
      } else if (index === 2) {
        vertexUrl = env.SODOT_VERTEX_URL_2;
        apiKey = env.SODOT_VERTEX_API_KEY_2;
      }

      if (!vertexUrl || !apiKey) {
        throw new Error(`Missing configuration for vertex ${index}`);
      }

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
          console.log(
            `Using pre-computed hash with hash_algo=none: ${messageToSign}`
          );
          requestBody.msg = messageToSign;
          requestBody.hash_algo = "none"; // Tell the API not to hash again
        } else {
          // If no pre-computed hash, let Sodot hash the message with keccak256
          console.log(`Using raw ECDSA message with hash_algo=keccak256`);
          requestBody.msg = messageToSign;
          requestBody.hash_algo = "keccak256"; // For Ethereum transactions
        }
      } else {
        // For Ed25519, just provide the message directly (no hash_algo)
        if (!messageToSign) {
          throw new Error("No message to sign for Ed25519");
        }
        requestBody.msg = messageToSign;
      }

      console.log(
        `Sending request to ${vertexUrl}/${curveType}/sign:`,
        JSON.stringify(requestBody)
      );

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

    // Format the signature based on chain/curve
    let formattedSignature;
    if ("signature" in signature) {
      // For Ed25519 signatures
      formattedSignature = signature.signature;
    } else if ("r" in signature && "s" in signature) {
      // For ECDSA signatures
      if (chainConfig.signerSpec.signatureFormat === "der") {
        formattedSignature = signature.der;
      } else if (chainConfig.signerSpec.signatureFormat === "rsv") {
        // RSV format for Ethereum
        formattedSignature = `${signature.r}${
          signature.s
        }${signature.v.toString(16)}`;
      } else if (chainConfig.signerSpec.signatureFormat === "rs") {
        // RS format (no recovery value)
        formattedSignature = `${signature.r}${signature.s}`;
      } else {
        // Default format
        formattedSignature = `${signature.r}${
          signature.s
        }${signature.v.toString(16)}`;
      }
    } else {
      formattedSignature = JSON.stringify(signature);
    }

    // Return the signature
    return res.status(200).json({
      status: 200,
      signature: formattedSignature,
      chainId: chain,
      curve: curveType,
      usedPrecomputedHash:
        curveType === "ecdsa" && usePrecomputedHash && !!hash,
    });
  } catch (error: any) {
    console.error(`Error signing transaction:`, error);
    return res.status(500).json({
      status: 500,
      error: "Failed to sign transaction",
      message: error.message,
    });
  }
}
