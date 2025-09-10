import type { NextApiRequest, NextApiResponse } from "next";

/**
 * API proxy for IoFinnet test connection
 * This endpoint tests the connection to IoFinnet's API
 * 
 * SIGNER-AGNOSTIC: This proxy only handles IoFinnet-specific communication
 * The calling component doesn't need to know IoFinnet implementation details
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
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
    // Check if IoFinnet environment variables are configured
    const baseUrl = process.env.IOFINNET_BASE_URL;
    const clientId = process.env.IOFINNET_CLIENT_ID;
    const clientSecret = process.env.IOFINNET_CLIENT_SECRET;
    const vaultId = process.env.IOFINNET_VAULT_ID;

    if (!baseUrl || !clientId || !clientSecret) {
      return res.status(503).json({
        message: "IoFinnet is not configured. Please set IOFINNET_BASE_URL, IOFINNET_CLIENT_ID, and IOFINNET_CLIENT_SECRET in your environment variables.",
        error: "NOT_CONFIGURED",
        data: {
          configured: false,
          missingVars: [
            !baseUrl && "IOFINNET_BASE_URL",
            !clientId && "IOFINNET_CLIENT_ID", 
            !clientSecret && "IOFINNET_CLIENT_SECRET",
            !vaultId && "IOFINNET_VAULT_ID",
          ].filter(Boolean),
        },
      });
    }

    // First, get an access token using IoFinnet's auth endpoint
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
      const errorText = await authResponse.text();
      console.error("IoFinnet auth error:", errorText);
      return res.status(503).json({
        message: "Failed to authenticate with IoFinnet",
        error: "AUTH_FAILED",
        details: errorText,
      });
    }

    const authData = await authResponse.json();
    const accessToken = authData.accessToken; // IoFinnet returns 'accessToken' not 'access_token'

    // Try to get vault details and addresses
    let vaultDetails = null;
    let vaultAddresses = [];
    
    if (vaultId) {
      // Get vault details
      const vaultResponse = await fetch(`${baseUrl}/v1/vaults/${vaultId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (vaultResponse.ok) {
        vaultDetails = await vaultResponse.json();
      }

      // Get vault addresses to find public keys
      const addressesResponse = await fetch(`${baseUrl}/v1/vaults/${vaultId}/addresses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (addressesResponse.ok) {
        const addressData = await addressesResponse.json();
        vaultAddresses = addressData.data || [];
      }
    }

    // Map chain IDs to IoFinnet asset types
    const chainToAsset: Record<string, string> = {
      "ethereum": "ETH",
      "bitcoin": "BTC",
      "bsc": "BNB",
      "polygon": "MATIC",
      "tron": "TRX",
    };

    // Find an address for the requested chain
    const assetType = chainToAsset[chain] || "ETH";
    const chainAddress = vaultAddresses.find((addr: any) => 
      addr.assetType === assetType || 
      addr.blockchain === chain.toUpperCase()
    );

    // Extract public key and address from vault data
    let pubkey = null;
    let address = null;

    if (chainAddress) {
      pubkey = chainAddress.publicKey || chainAddress.pubKey;
      address = chainAddress.address;
    }

    // If no address found, return configuration success but indicate no keys
    if (!pubkey && vaultId) {
      return res.status(200).json({
        success: true,
        message: `IoFinnet connected but no ${chain} address found in vault`,
        data: {
          configured: true,
          chain,
          vault: vaultDetails ? {
            id: vaultDetails.id,
            name: vaultDetails.name,
            status: vaultDetails.status,
            addressCount: vaultAddresses.length,
          } : null,
          availableAssets: vaultAddresses.map((a: any) => a.assetType).filter(Boolean),
        },
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "IoFinnet connection successful",
      data: {
        configured: true,
        chain,
        pubkey: pubkey || `0x${"0".repeat(64)}`, // Fallback for testing
        address: address || `0x${"0".repeat(40)}`, // Fallback for testing
        vault: vaultDetails ? {
          id: vaultDetails.id,
          name: vaultDetails.name,
          status: vaultDetails.status,
          addressCount: vaultAddresses.length,
        } : null,
        requestDetails: {
          assetType,
          curve: "secp256k1",
          fromVault: !!chainAddress,
        },
      },
    });
  } catch (error: any) {
    console.error("IoFinnet proxy error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}