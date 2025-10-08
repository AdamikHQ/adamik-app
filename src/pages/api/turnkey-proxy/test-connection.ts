import { NextApiRequest, NextApiResponse } from "next";
import { Turnkey } from "@turnkey/sdk-server";
import { handleApiError } from "~/utils/api/signerProxyUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check if Turnkey is configured
    const missingVars = [];
    if (!process.env.TURNKEY_BASE_URL) missingVars.push("TURNKEY_BASE_URL");
    if (!process.env.TURNKEY_API_PUBLIC_KEY) missingVars.push("TURNKEY_API_PUBLIC_KEY");
    if (!process.env.TURNKEY_API_PRIVATE_KEY) missingVars.push("TURNKEY_API_PRIVATE_KEY");
    if (!process.env.TURNKEY_ORGANIZATION_ID) missingVars.push("TURNKEY_ORGANIZATION_ID");
    if (!process.env.TURNKEY_WALLET_ID) missingVars.push("TURNKEY_WALLET_ID");

    if (missingVars.length > 0) {
      return res.status(200).json({
        success: false,
        message: `Turnkey not configured. Missing environment variables: ${missingVars.join(", ")}`,
      });
    }

    // Initialize Turnkey client
    const turnkeyClient = new Turnkey({
      apiBaseUrl: process.env.TURNKEY_BASE_URL!,
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
      defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    console.log("Testing Turnkey connection...");

    // Try to get wallet information to verify connection
    const walletInfo = await turnkeyClient
      .apiClient()
      .getWallet({
        walletId: process.env.TURNKEY_WALLET_ID!,
      });

    console.log("Turnkey connection successful. Wallet:", walletInfo.wallet.walletName);

    // Get wallet accounts to show more info
    const { accounts } = await turnkeyClient
      .apiClient()
      .getWalletAccounts({
        walletId: process.env.TURNKEY_WALLET_ID,
        paginationOptions: {
          limit: "10",
        },
      });

    return res.status(200).json({
      success: true,
      message: "Successfully connected to Turnkey",
      details: {
        organizationId: process.env.TURNKEY_ORGANIZATION_ID,
        walletName: walletInfo.wallet.walletName,
        walletId: process.env.TURNKEY_WALLET_ID,
        accountCount: accounts.length,
        baseUrl: process.env.TURNKEY_BASE_URL,
      },
    });
  } catch (error: any) {
    console.error("Turnkey test-connection error:", error);
    
    // Return a user-friendly error message
    let message = "Failed to connect to Turnkey";
    if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      message = "Authentication failed. Please check your API keys.";
    } else if (error.message?.includes("404")) {
      message = "Wallet not found. Please check your wallet ID.";
    } else if (error.message?.includes("Network") || error.message?.includes("fetch")) {
      message = "Network error. Please check your Turnkey base URL.";
    }

    return res.status(200).json({
      success: false,
      message,
      error: error.message,
    });
  }
}