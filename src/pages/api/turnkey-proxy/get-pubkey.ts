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
    const { curve, coinType, chainId } = req.body;

    // Validate environment variables
    if (!process.env.TURNKEY_BASE_URL) {
      throw new Error("TURNKEY_BASE_URL is not configured");
    }
    if (!process.env.TURNKEY_API_PUBLIC_KEY) {
      throw new Error("TURNKEY_API_PUBLIC_KEY is not configured");
    }
    if (!process.env.TURNKEY_API_PRIVATE_KEY) {
      throw new Error("TURNKEY_API_PRIVATE_KEY is not configured");
    }
    if (!process.env.TURNKEY_ORGANIZATION_ID) {
      throw new Error("TURNKEY_ORGANIZATION_ID is not configured");
    }
    if (!process.env.TURNKEY_WALLET_ID) {
      throw new Error("TURNKEY_WALLET_ID is not configured");
    }

    // Initialize Turnkey client
    const turnkeyClient = new Turnkey({
      apiBaseUrl: process.env.TURNKEY_BASE_URL,
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY,
      defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID,
    });

    // Convert Adamik curve to Turnkey curve
    const convertCurve = (adamikCurve: string): "CURVE_SECP256K1" | "CURVE_ED25519" => {
      switch (adamikCurve) {
        case "secp256k1":
          return "CURVE_SECP256K1";
        case "ed25519":
          return "CURVE_ED25519";
        default:
          throw new Error(`Unsupported curve: ${adamikCurve}`);
      }
    };

    // Get coin type from derivation path
    const getCoinTypeFromPath = (path: string): number | null => {
      if (!path.startsWith("m/")) return null;
      const segments = path.split("/");
      if (segments.length < 3) return null;
      const coinTypeSegment = segments[2];
      const parsedCoinType = parseInt(coinTypeSegment.replace("'", ""));
      return isNaN(parsedCoinType) ? null : parsedCoinType;
    };

    const turnkeyCurve = convertCurve(curve);

    // Get wallet accounts
    const { accounts } = await turnkeyClient
      .apiClient()
      .getWalletAccounts({
        walletId: process.env.TURNKEY_WALLET_ID,
        paginationOptions: {
          limit: "100",
        },
      });

    console.log(`Looking for account with curve: ${turnkeyCurve}, coinType: ${coinType}`);
    
    // Look for existing account with matching curve and coin type
    const existingAccount = accounts.find(
      (account) =>
        account.curve === turnkeyCurve &&
        getCoinTypeFromPath(account.path) === Number(coinType) &&
        account.addressFormat === "ADDRESS_FORMAT_COMPRESSED"
    );

    if (existingAccount) {
      console.log("Found existing account:", existingAccount.address);
      return res.status(200).json({ pubkey: existingAccount.address });
    }

    // Create new account if it doesn't exist
    console.log("Creating new account for curve:", turnkeyCurve, "coinType:", coinType);
    const createResult = await turnkeyClient
      .apiClient()
      .createWalletAccounts({
        walletId: process.env.TURNKEY_WALLET_ID,
        accounts: [
          {
            curve: turnkeyCurve,
            path: `m/44'/${coinType}'/0'/0/0`,
            pathFormat: "PATH_FORMAT_BIP32",
            addressFormat: "ADDRESS_FORMAT_COMPRESSED",
          },
        ],
      });

    const pubkey = createResult.addresses[0];
    console.log("Created new account with pubkey:", pubkey);

    return res.status(200).json({ pubkey });
  } catch (error: any) {
    console.error("Turnkey get-pubkey error:", error);
    handleApiError(res, error, "Turnkey get-pubkey");
  }
}