import { NextApiRequest, NextApiResponse } from "next";
import { DfnsApiClient } from "@dfns/sdk";
import { AsymmetricKeySigner } from "@dfns/sdk-keysigner";

// Convert Adamik curve to DFNS network type
function convertAdamikCurveToDfnsCurve(
  curve: string
): "KeyECDSAStark" | "KeyEdDSA" | "KeyECDSA" {
  switch (curve) {
    case "stark":
      return "KeyECDSAStark";
    case "ed25519":
      return "KeyEdDSA";
    case "secp256k1":
      return "KeyECDSA";
    default:
      throw new Error(`Unsupported curve: ${curve}`);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { chainId, curve } = req.body;

    if (!chainId || !curve) {
      return res.status(400).json({ error: "Missing chainId or curve" });
    }

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

    // Convert curve to DFNS network type
    const network = convertAdamikCurveToDfnsCurve(curve);

    // List existing wallets
    const wallets = await dfnsApi.wallets.listWallets();
    
    // Find existing wallet for this curve
    let existingWallet = wallets.items.find((item) => item.network === network);

    let walletId: string;
    let publicKey: string;

    if (existingWallet) {
      console.log(`Using existing DFNS wallet for ${network}: ${existingWallet.id}`);
      walletId = existingWallet.id;
      publicKey = existingWallet.signingKey.publicKey;
      console.log(`Raw DFNS public key for ${network}:`, publicKey);
    } else {
      console.log(`Creating new DFNS wallet for ${network}`);
      
      // Create new wallet
      const newWallet = await dfnsApi.wallets.createWallet({
        body: {
          network,
        },
      });

      console.log(`Created new DFNS wallet: ${newWallet.id}`);
      walletId = newWallet.id;
      publicKey = newWallet.signingKey.publicKey;
    }

    return res.status(200).json({
      success: true,
      walletId,
      publicKey,
      network,
    });
  } catch (error) {
    console.error("DFNS get pubkey error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get DFNS public key",
    });
  }
}