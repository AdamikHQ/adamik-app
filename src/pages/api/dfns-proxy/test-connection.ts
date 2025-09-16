import { NextApiRequest, NextApiResponse } from "next";
import { DfnsApiClient } from "@dfns/sdk";
import { AsymmetricKeySigner } from "@dfns/sdk-keysigner";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check required environment variables
    if (!process.env.DFNS_CRED_ID) {
      throw new Error("DFNS_CRED_ID is not configured");
    }
    if (!process.env.DFNS_PRIVATE_KEY) {
      throw new Error("DFNS_PRIVATE_KEY is not configured");
    }
    if (!process.env.DFNS_APP_ID) {
      throw new Error("DFNS_APP_ID is not configured");
    }
    if (!process.env.DFNS_AUTH_TOKEN) {
      throw new Error("DFNS_AUTH_TOKEN is not configured");
    }
    if (!process.env.DFNS_API_URL) {
      throw new Error("DFNS_API_URL is not configured");
    }

    // Create DFNS client
    const signer = new AsymmetricKeySigner({
      credId: process.env.DFNS_CRED_ID,
      privateKey: process.env.DFNS_PRIVATE_KEY,
    });

    const dfnsApi = new DfnsApiClient({
      authToken: process.env.DFNS_AUTH_TOKEN,
      baseUrl: process.env.DFNS_API_URL,
      appId: process.env.DFNS_APP_ID || "",
      signer,
    } as any);

    // Test connection by listing wallets
    const wallets = await dfnsApi.wallets.listWallets();
    
    console.log("DFNS test connection successful");
    console.log(`Found ${wallets.items.length} wallets`);

    return res.status(200).json({ 
      success: true, 
      message: "DFNS connection successful",
      walletsCount: wallets.items.length,
      wallets: wallets.items.map(w => ({
        id: w.id,
        network: w.network,
        publicKey: w.signingKey?.publicKey
      }))
    });
  } catch (error) {
    console.error("DFNS test connection error:", error);
    return res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to DFNS" 
    });
  }
}