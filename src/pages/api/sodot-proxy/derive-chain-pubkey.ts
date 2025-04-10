import { NextApiRequest, NextApiResponse } from "next";

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

// Type definitions for supported chains
type SupportedChain = "ethereum" | "bitcoin" | "ton" | "tron" | "algorand";

interface ChainConfig {
  curve: "ecdsa" | "ed25519";
  keyIdsEnvVar: string;
  coinType: number;
  derivationPath: number[];
}

// Configuration for each supported chain
const chainConfigs: Record<SupportedChain, ChainConfig> = {
  ethereum: {
    curve: "ecdsa",
    keyIdsEnvVar: "SODOT_EXISTING_ECDSA_KEY_IDS",
    coinType: 60,
    derivationPath: [44, 60, 0, 0, 0],
  },
  bitcoin: {
    curve: "ecdsa",
    keyIdsEnvVar: "SODOT_EXISTING_ECDSA_KEY_IDS",
    coinType: 0,
    derivationPath: [44, 0, 0, 0, 0],
  },
  ton: {
    curve: "ecdsa", // TON uses secp256k1 (ECDSA)
    keyIdsEnvVar: "SODOT_EXISTING_ECDSA_KEY_IDS",
    coinType: 607, // TON coin type
    derivationPath: [44, 607, 0, 0, 0],
  },
  tron: {
    curve: "ecdsa",
    keyIdsEnvVar: "SODOT_EXISTING_ECDSA_KEY_IDS",
    coinType: 195,
    derivationPath: [44, 195, 0, 0, 0],
  },
  algorand: {
    curve: "ed25519",
    keyIdsEnvVar: "SODOT_EXISTING_ED25519_KEY_IDS",
    coinType: 283, // Algorand coin type
    derivationPath: [44, 283, 0, 0, 0],
  },
};

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
        message:
          "Please specify a chain (ethereum, bitcoin, ton, tron, algorand)",
      });
    }

    // Validate supported chain
    if (!Object.keys(chainConfigs).includes(chain)) {
      return res.status(400).json({
        status: 400,
        error: "Unsupported chain",
        message: `Chain '${chain}' is not supported. Use one of: ${Object.keys(
          chainConfigs
        ).join(", ")}`,
      });
    }

    const chainName = chain as SupportedChain;
    const config = chainConfigs[chainName];

    // Get key IDs for this chain's curve
    const keyIdsStr = process.env[config.keyIdsEnvVar];
    if (!keyIdsStr) {
      return res.status(500).json({
        status: 500,
        error: "Missing key IDs",
        message: `No key IDs found in ${config.keyIdsEnvVar} environment variable`,
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

    const baseUrl = getBaseUrl(req);
    const vertexId = 0; // We only need to use one vertex for derivation

    // Use the appropriate vertex to derive the public key
    const response = await fetch(
      `${baseUrl}/api/sodot-proxy/${config.curve}/derive-pubkey?vertex=${vertexId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_id: keyIds[vertexId],
          derivation_path: config.derivationPath,
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
    if (config.curve === "ed25519") {
      // ED25519 response format: { pubkey: "..." }
      pubkey = result.data.pubkey;
      if (!pubkey) {
        throw new Error("ED25519 pubkey missing from response");
      }
    } else {
      // SECP256K1 response format: { compressed: "...", uncompressed: "..." }
      if (chainName === "ethereum" || chainName === "tron") {
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

    // Add prefix if needed for Solana (ED25519 keys in Solana often need a prefix)
    if (chainName === "ton" && !pubkey.startsWith("0x")) {
      // Some TON implementations might need a prefix
      pubkey = pubkey;
    }

    // Return just the pubkey to the client
    return res.status(200).json({
      status: 200,
      data: {
        pubkey,
        curve: config.curve,
        chain: chainName,
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
