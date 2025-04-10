import { NextApiRequest, NextApiResponse } from "next";
import { getChains } from "~/api/adamik/chains";
import { Chain } from "~/utils/types";

// Helper function to get the base URL
function getBaseUrl(req: NextApiRequest): string {
  // Prefer Vercel URL if available (for production)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  // Use request headers for local development
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host || "localhost:3000";
  return `${protocol}://${host}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Extract chain from query
    const { chain } = req.query;

    if (!chain || typeof chain !== "string") {
      return res.status(400).json({
        status: 400,
        error: "Missing chain parameter",
        message: "Please specify a chain parameter",
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
    const keyIdsEnvVar =
      curveType === "ecdsa"
        ? "SODOT_EXISTING_ECDSA_KEY_IDS"
        : "SODOT_EXISTING_ED25519_KEY_IDS";

    const keyIdsStr = process.env[keyIdsEnvVar];
    if (!keyIdsStr) {
      return res.status(500).json({
        status: 500,
        error: "Missing key IDs",
        message: `No key IDs found in ${keyIdsEnvVar} environment variable`,
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

    const baseUrl = getBaseUrl(req);
    const vertexId = 0; // We only need to use one vertex for derivation

    // Use the appropriate vertex to derive the public key
    const response = await fetch(
      `${baseUrl}/api/sodot-proxy/${curveType}/derive-pubkey?vertex=${vertexId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_id: keyIds[vertexId],
          derivation_path: derivationPath,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    if (!result.data) {
      throw new Error("Invalid response format");
    }

    // Format the response based on chain/curve
    let pubkey;
    if (curveType === "ed25519") {
      // ED25519 response format: { pubkey: "..." }
      pubkey = result.data.pubkey;
      if (!pubkey) {
        throw new Error("ED25519 pubkey missing from response");
      }
    } else {
      // SECP256K1 response format: { compressed: "...", uncompressed: "..." }
      if (chainConfig.family === "evm") {
        pubkey = result.data.uncompressed;
        if (!pubkey) {
          throw new Error("Uncompressed pubkey missing from response");
        }
      } else {
        pubkey = result.data.compressed;
        if (!pubkey) {
          throw new Error("Compressed pubkey missing from response");
        }
      }
    }

    // Return the pubkey to the client
    return res.status(200).json({
      status: 200,
      data: {
        pubkey,
        curve: curveType,
        chain: chain,
      },
    });
  } catch (error: any) {
    console.error(`Error deriving chain pubkey:`, error);
    return res.status(500).json({
      status: 500,
      error: "Failed to derive chain pubkey",
      message: error.message,
    });
  }
}
