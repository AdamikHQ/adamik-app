import { Chain } from "./types";
import { amountToMainUnit, formatAmount } from "./helper";
import { getTokenInfo } from "~/api/adamik/tokens";
import { getChains } from "~/api/adamik/chains";

type AssetType = "native" | "token";

interface AssetIdentifier {
  chainId: string;
  type: AssetType;
  tokenId?: string;
}

interface FormatAssetAmountOptions {
  asset: AssetIdentifier;
  amount: string | number;
  chainData?: Record<string, Chain>; // Optional chain data to avoid refetching
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

/**
 * Formats an asset amount considering its native chain decimals or token-specific decimals
 * @param options FormatAssetAmountOptions object containing asset identifier and amount
 * @returns Promise<string> Formatted amount string
 */
export async function formatAssetAmount({
  asset,
  amount,
  chainData,
  maximumFractionDigits,
  minimumFractionDigits,
}: FormatAssetAmountOptions): Promise<string> {
  try {
    let decimals: number;

    if (asset.type === "native") {
      // Get chain data either from provided data or fetch it
      const chains = chainData || (await getChains());
      if (!chains) {
        console.warn(`Failed to fetch chain data for ${asset.chainId}`);
        return "0";
      }

      const chain = chains[asset.chainId];
      if (!chain) {
        console.warn(`Chain ${asset.chainId} not found in supported chains`);
        return "0";
      }
      decimals = chain.decimals;
    } else {
      // Get token decimals
      if (!asset.tokenId) {
        console.warn("Token ID is required for token assets");
        return "0";
      }

      const token = await getTokenInfo(asset.chainId, asset.tokenId);
      if (!token) {
        console.warn(
          `Token ${asset.tokenId} not found for chain ${asset.chainId}`
        );
        return "0";
      }
      decimals = token.decimals;
    }

    // Convert from smallest unit to main unit
    const mainUnitAmount = amountToMainUnit(amount.toString(), decimals);
    if (!mainUnitAmount) return "0";

    // Format the amount with specified or default decimal places
    return formatAmount(mainUnitAmount, maximumFractionDigits ?? decimals);
  } catch (error) {
    console.error("Error formatting asset amount:", error);
    return "0";
  }
}

// Helper function to determine if an amount needs compact notation (K, M, B, etc.)
export function shouldUseCompactNotation(amount: number): boolean {
  return Math.abs(amount) >= 1000;
}

// Optional: Add more asset-related formatting utilities here
