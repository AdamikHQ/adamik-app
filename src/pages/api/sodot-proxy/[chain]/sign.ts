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
    const { transaction } = req.body;

    if (!chain || typeof chain !== "string") {
      return res.status(400).json({
        status: 400,
        error: "Missing chain parameter",
        message: "Chain parameter is required",
      });
    }

    if (!transaction) {
      return res.status(400).json({
        status: 400,
        error: "Missing transaction",
        message: "Transaction is required in the request body",
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

    // Ensure the transaction is properly formatted
    let formattedTransaction = transaction;
    if (formattedTransaction.startsWith("0x")) {
      formattedTransaction = formattedTransaction.substring(2);
    }

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

      const response = await fetch(`${vertexUrl}/${curveType}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({
          room_uuid: roomUuid,
          key_id: keyId,
          msg: formattedTransaction,
          derivation_path: derivationPath,
        }),
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
      formattedSignature = signature.signature;
    } else if ("r" in signature && "s" in signature) {
      // For ECDSA signatures
      if (chainConfig.signerSpec.signatureFormat === "der") {
        formattedSignature = signature.der;
      } else {
        // RSV format for Ethereum
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
