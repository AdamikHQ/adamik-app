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

    // Get vault details to extract public keys (following adamik-link implementation)
    let vaultDetails = null;
    let publicKeys: Map<string, string> = new Map();
    
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
        
        // Extract public keys from curves array
        if (vaultDetails.curves && Array.isArray(vaultDetails.curves)) {
          for (const curveData of vaultDetails.curves) {
            if (curveData.publicKey) {
              let curveKey: string;
              if (curveData.algorithm === "ECDSA" && curveData.curve === "Secp256k1") {
                curveKey = "ECDSA_SECP256K1";
              } else if (curveData.algorithm === "EDDSA" && curveData.curve === "Edwards") {
                curveKey = "EDDSA_ED25519";
              } else {
                curveKey = `${curveData.algorithm}_${curveData.curve}`;
              }
              
              const pubKey = curveData.publicKey.startsWith("0x") 
                ? curveData.publicKey 
                : `0x${curveData.publicKey}`;
              
              publicKeys.set(curveKey, pubKey);
            }
          }
        }
      }
    }

    // Determine which curve type we need for this chain
    const getCurveTypeForChain = (chainId: string): string => {
      const ed25519Chains = ["algorand", "solana", "stellar"];
      if (ed25519Chains.includes(chainId)) {
        return "EDDSA_ED25519";
      }
      return "ECDSA_SECP256K1";
    };

    const curveType = getCurveTypeForChain(chain);
    const pubkey = publicKeys.get(curveType);

    // If no pubkey found, return configuration success but indicate no keys
    if (!pubkey && vaultId) {
      return res.status(200).json({
        success: true,
        message: `IoFinnet connected but no public key found for ${curveType}`,
        data: {
          configured: true,
          chain,
          vault: vaultDetails ? {
            id: vaultDetails.id,
            name: vaultDetails.name,
            status: vaultDetails.status,
            curvesCount: publicKeys.size,
          } : null,
          availableCurves: Array.from(publicKeys.keys()),
        },
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "IoFinnet connection successful",
      data: {
        configured: true,
        chain,
        pubkey: pubkey || null,
        address: null, // Address will be derived from pubkey by Adamik API
        vault: vaultDetails ? {
          id: vaultDetails.id,
          name: vaultDetails.name,
          status: vaultDetails.status,
          curvesCount: publicKeys.size,
          availableCurves: Array.from(publicKeys.keys()),
        } : null,
        requestDetails: {
          curveType: curveType,
          curve: curveType === "ECDSA_SECP256K1" ? "secp256k1" : "ed25519",
          fromVault: !!pubkey,
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