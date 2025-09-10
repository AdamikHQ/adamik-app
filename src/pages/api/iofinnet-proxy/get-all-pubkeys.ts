import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Fetch all public keys from IoFinnet vault
 * IoFinnet only has two keys: ECDSA_SECP256K1 and EDDSA_ED25519
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
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

    // Get vault details to extract public keys
    const vaultResponse = await fetch(
      `${baseUrl}/v1/vaults/${vaultId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!vaultResponse.ok) {
      throw new Error("Failed to fetch vault details");
    }

    const vaultDetails = await vaultResponse.json();
    
    // Extract both public keys from vault
    const publicKeys: Record<string, string> = {};
    
    if (vaultDetails.curves && Array.isArray(vaultDetails.curves)) {
      for (const curveData of vaultDetails.curves) {
        if (curveData.publicKey) {
          // Map IoFinnet curve names to our internal format
          let curveKey: string;
          if (curveData.algorithm === "ECDSA" && curveData.curve === "Secp256k1") {
            curveKey = "ECDSA_SECP256K1";
          } else if (curveData.algorithm === "EDDSA" && curveData.curve === "Edwards") {
            curveKey = "EDDSA_ED25519";
          } else {
            curveKey = `${curveData.algorithm}_${curveData.curve}`;
          }
          
          // Store the public key with 0x prefix for consistency
          const pubKey = curveData.publicKey.startsWith("0x") 
            ? curveData.publicKey 
            : `0x${curveData.publicKey}`;
          
          publicKeys[curveKey] = pubKey;
        }
      }
    }

    return res.status(200).json({
      success: true,
      publicKeys: publicKeys,
    });
  } catch (error: any) {
    console.error("IoFinnet get-all-pubkeys error:", error);
    return res.status(500).json({
      message: "Failed to get public keys",
      error: error.message,
    });
  }
}