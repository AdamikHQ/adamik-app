import { Chain, Asset } from "./types";
import { amountToMainUnit, formatAmount } from "./helper";
import { getTokenInfo } from "~/api/adamik/token";
import { getChains } from "~/api/adamik/chains";

// Use a subset of Asset properties that we need
type AssetFormatInfo = Pick<Asset, "chainId" | "isToken" | "assetId">;

export interface FormatAssetAmountOptions {
  asset: AssetFormatInfo;
  amount: string | number;
  chainData?: Record<string, Chain> | null;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

export interface FormatAssetAmountResult {
  formatted: string; // The formatted amount
  ticker: string; // The asset ticker
}

/**
 * Formats an asset amount considering its native chain decimals or token-specific decimals
 * @param options FormatAssetAmountOptions object containing asset identifier and amount
 * @returns Promise<FormatAssetAmountResult> Formatted amount string and ticker
 */
export async function formatAssetAmount({
  asset,
  amount,
  chainData,
  maximumFractionDigits,
  minimumFractionDigits,
}: FormatAssetAmountOptions): Promise<FormatAssetAmountResult> {
  try {
    let decimals: number;
    let ticker: string = "";

    if (!asset.isToken) {
      const chains = chainData || (await getChains());
      if (!chains) {
        return { formatted: "0", ticker: "" };
      }

      const chain = chains[asset.chainId];
      if (!chain) {
        return { formatted: "0", ticker: "" };
      }
      decimals = chain.decimals;
      ticker = chain.ticker;
    } else {
      if (!asset.assetId) {
        return { formatted: "0", ticker: "" };
      }

      const token = await getTokenInfo(asset.chainId, asset.assetId);
      if (!token) {
        return { formatted: "0", ticker: "" };
      }
      decimals = token.decimals;
      ticker = token.ticker;
    }

    const mainUnitAmount = amountToMainUnit(Number(amount).toFixed(), decimals);
    if (!mainUnitAmount) return { formatted: "0", ticker: "" };

    const formatted = formatAmount(
      mainUnitAmount,
      maximumFractionDigits ?? decimals
    );

    return { formatted, ticker };
  } catch (error) {
    console.error("Error formatting asset amount:", error);
    return { formatted: "0", ticker: "" };
  }
}

// Helper function to determine if an amount needs compact notation (K, M, B, etc.)
export function shouldUseCompactNotation(amount: number): boolean {
  return Math.abs(amount) >= 1000;
}

// Optional: Add more asset-related formatting utilities here
