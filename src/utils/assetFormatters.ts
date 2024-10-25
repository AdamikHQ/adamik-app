import { Chain } from "./types";
import { amountToMainUnit, formatAmount } from "./helper";
import { getTokenInfo } from "~/api/adamik/tokens";
import { getChains } from "~/api/adamik/chains";

// Add simple caches at the top
const tokenCache: Record<string, { decimals: number; ticker: string }> = {};
const chainCache: Record<string, Chain> = {};
const CACHE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const cacheTimestamps: Record<string, number> = {};

// Export the types
export type AssetType = "native" | "token";

export interface AssetIdentifier {
  chainId: string;
  type: AssetType;
  tokenId?: string;
}

export interface FormatAssetAmountOptions {
  asset: AssetIdentifier;
  amount: string | number;
  chainData?: Record<string, Chain> | null; // Allow null
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

    if (asset.type === "native") {
      // Use provided chainData or check cache first
      const chain = chainData?.[asset.chainId] || chainCache[asset.chainId];

      if (
        !chain ||
        (cacheTimestamps[asset.chainId] &&
          Date.now() - cacheTimestamps[asset.chainId] > CACHE_TIMEOUT)
      ) {
        const chains = await getChains();
        if (!chains) return { formatted: "0", ticker: "" };

        chainCache[asset.chainId] = chains[asset.chainId];
        cacheTimestamps[asset.chainId] = Date.now();
      }

      decimals = chainCache[asset.chainId].decimals;
      ticker = chainCache[asset.chainId].ticker;
    } else {
      if (!asset.tokenId) return { formatted: "0", ticker: "" };

      // Check token cache
      const cacheKey = `${asset.chainId}-${asset.tokenId}`;
      if (
        !tokenCache[cacheKey] ||
        Date.now() - cacheTimestamps[cacheKey] > CACHE_TIMEOUT
      ) {
        const token = await getTokenInfo(asset.chainId, asset.tokenId);
        if (!token) return { formatted: "0", ticker: "" };

        tokenCache[cacheKey] = {
          decimals: token.decimals,
          ticker: token.ticker,
        };
        cacheTimestamps[cacheKey] = Date.now();
      }

      decimals = tokenCache[cacheKey].decimals;
      ticker = tokenCache[cacheKey].ticker;
    }

    const mainUnitAmount = amountToMainUnit(amount.toString(), decimals);
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
