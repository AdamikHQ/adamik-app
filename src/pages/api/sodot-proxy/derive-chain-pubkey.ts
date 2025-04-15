import { NextApiRequest, NextApiResponse } from "next";
import { getChains } from "~/api/adamik/chains";
import { Chain } from "~/utils/types";
import { env } from "~/env";

// Cache object to store pubkeys by curve and coin type
// Format: { "ecdsa:60": { pubkey: "0x...", timestamp: 123456789 } }
const pubkeyCache: Record<string, { pubkey: string; timestamp: number }> = {};

// Cache expiration time: 24 hours (in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Helper function to get the base URL (no longer used since we're making direct requests)
function getBaseUrl(req: NextApiRequest): string {
  // For Vercel deployments, use the VERCEL_URL environment variable
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // For custom domains in Vercel, use the host header
  if (req.headers.host && !req.headers.host.includes("localhost")) {
    return `https://${req.headers.host}`;
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
    console.log(`Derive pubkey request for chain: ${chain}`);

    // Quick env check
    const hasKeys =
      !!env.SODOT_EXISTING_ECDSA_KEY_IDS &&
      !!env.SODOT_EXISTING_ED25519_KEY_IDS;
    const hasVertex = !!env.SODOT_VERTEX_URL_0 && !!env.SODOT_VERTEX_API_KEY_0;

    if (!hasKeys || !hasVertex) {
      console.error("Missing required environment variables");
      return res.status(500).json({
        status: 500,
        error: "Missing environment configuration",
        message: "Server is not properly configured",
      });
    }

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

    // Construct derivation path based on BIP-44 standard
    const coinType = parseInt(chainConfig.signerSpec.coinType);
    const derivationPath = [44, coinType, 0, 0, 0];
    console.log(
      `${chain}: ${curveType}/${coinType} [${derivationPath.join("/")}]`
    );

    // Check cache using curve and coin type as key
    const cacheKey = `${curveType}:${coinType}`;
    const cachedPubkey = pubkeyCache[cacheKey];
    const now = Date.now();

    let pubkey;
    let isCacheHit = false;

    // If we have a valid, non-expired result in cache, use it
    if (cachedPubkey && now - cachedPubkey.timestamp < CACHE_EXPIRATION) {
      console.log(`✓ Cache hit for ${cacheKey}`);
      pubkey = cachedPubkey.pubkey;
      isCacheHit = true;
    } else {
      console.log(`⟳ Deriving from Sodot for ${cacheKey}`);

      // Get key IDs for this chain's curve from the env object
      const keyIdsStr =
        curveType === "ecdsa"
          ? env.SODOT_EXISTING_ECDSA_KEY_IDS
          : env.SODOT_EXISTING_ED25519_KEY_IDS;

      const keyIds = keyIdsStr.split(",");

      if (keyIds.length < 1) {
        return res.status(500).json({
          status: 500,
          error: "Insufficient key IDs",
          message: `Found only ${keyIds.length} key IDs, need at least 1`,
        });
      }

      // Get vertex information
      const vertexUrl = env.SODOT_VERTEX_URL_0;
      const vertexApiKey = env.SODOT_VERTEX_API_KEY_0;

      // Ensure we have the vertex information
      if (!vertexUrl || !vertexApiKey) {
        return res.status(500).json({
          status: 500,
          error: "Missing vertex configuration",
          message: "Vertex URL or API key is missing",
        });
      }

      // The correct endpoint for deriving a public key
      const endpointUrl = `${vertexUrl}/${curveType}/derive-pubkey`;

      // Direct request to the vertex
      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${vertexApiKey}`,
        },
        body: JSON.stringify({
          key_id: keyIds[0], // Use the first key ID
          derivation_path: derivationPath,
        }),
      });

      if (!response.ok) {
        let errorText = "";
        try {
          const errorJson = await response.json();
          errorText = JSON.stringify(errorJson);
        } catch {
          errorText = await response.text();
        }

        console.error(`Error from vertex: ${response.status} - ${errorText}`);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();

      // Format the response based on chain/curve
      if (curveType === "ed25519") {
        // ED25519 response format
        pubkey = result.pubkey;
        if (!pubkey) {
          throw new Error("ED25519 pubkey missing from response");
        }
      } else {
        // SECP256K1 response format
        if (chainConfig.family === "evm") {
          pubkey = result.uncompressed;
          if (!pubkey) {
            throw new Error("Uncompressed pubkey missing from response");
          }
        } else {
          pubkey = result.compressed;
          if (!pubkey) {
            throw new Error("Compressed pubkey missing from response");
          }
        }
      }

      // Store the result in cache
      pubkeyCache[cacheKey] = {
        pubkey,
        timestamp: now,
      };
      console.log(`✓ Cached pubkey for ${cacheKey}`);
    }

    // Return the pubkey to the client along with request details
    return res.status(200).json({
      status: 200,
      data: {
        pubkey,
        curve: curveType,
        chain: chain,
        requestDetails: {
          derivationPath,
          coinType,
          curve: curveType,
          fromCache: isCacheHit,
        },
      },
    });
  } catch (error: any) {
    console.error(`Error deriving chain pubkey:`, error);
    return res.status(500).json({
      status: 500,
      error: "Failed to derive chain pubkey",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
