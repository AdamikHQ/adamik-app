import type { NextApiRequest, NextApiResponse } from "next";

/**
 * SIGNER-AGNOSTIC API proxy for IoFinnet public key retrieval
 * This endpoint is only called by the IoFinnet signer class
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { chain } = req.query;

  if (!chain || typeof chain !== "string") {
    return res.status(400).json({ 
      message: "Chain parameter is required",
      error: "MISSING_CHAIN" 
    });
  }

  try {
    const baseUrl = process.env.IOFINNET_BASE_URL;
    const clientId = process.env.IOFINNET_CLIENT_ID;
    const clientSecret = process.env.IOFINNET_CLIENT_SECRET;
    const vaultId = process.env.IOFINNET_VAULT_ID;

    if (!baseUrl || !clientId || !clientSecret || !vaultId) {
      return res.status(503).json({
        message: "IoFinnet is not configured",
        error: "NOT_CONFIGURED",
      });
    }

    // Authenticate with IoFinnet
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

    // Get vault addresses to find the public key for this chain
    const addressesResponse = await fetch(
      `${baseUrl}/v1/vaults/${vaultId}/addresses`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!addressesResponse.ok) {
      throw new Error("Failed to fetch vault addresses");
    }

    const addressData = await addressesResponse.json();
    const addresses = addressData.data || [];

    // Map chain to IoFinnet asset type (from adamik-link implementation)
    const chainToAsset: Record<string, string> = {
      "ethereum": "ETH",
      "bitcoin": "BTC",
      "bitcoin-testnet": "BTC",
      "bsc": "BNB",
      "polygon": "MATIC",
      "tron": "TRX",
      "base": "ETH",
      "optimism": "ETH",
      "arbitrum": "ETH",
      "avalanche": "AVAX",
    };

    const assetType = chainToAsset[chain] || "ETH";
    
    // Find address for this chain
    const chainAddress = addresses.find((addr: any) => 
      addr.assetType === assetType || 
      addr.blockchain === chain.toUpperCase()
    );

    if (!chainAddress || !chainAddress.publicKey) {
      // If no address found, we might need to derive it
      // For now, return an error
      return res.status(404).json({
        message: `No public key found for chain ${chain}`,
        error: "PUBKEY_NOT_FOUND",
      });
    }

    // Check if we need to compress the public key (from adamik-link logic)
    const needsCompression = chain === "bitcoin" || chain === "bitcoin-testnet";
    let pubkey = chainAddress.publicKey;

    if (needsCompression && pubkey.length > 66) {
      // IoFinnet returns uncompressed, we might need to compress for Bitcoin
      // This would require additional cryptographic operations
      // For now, use as-is and let Adamik API handle it
    }

    return res.status(200).json({
      success: true,
      pubkey: pubkey,
      chain: chain,
      assetType: assetType,
    });
  } catch (error: any) {
    console.error("IoFinnet get-pubkey error:", error);
    return res.status(500).json({
      message: "Failed to get public key",
      error: error.message,
    });
  }
}