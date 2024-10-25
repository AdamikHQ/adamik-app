import { Chain } from "./types";
import { amountToMainUnit, formatAmount } from "./helper";
import { getTokenInfo } from "~/api/adamik/tokens";
import { getChains } from "~/api/adamik/chains";

// Add a simple in-memory cache for tokens and chains
const tokenCache: Record<string, { decimals: number; ticker: string }> = {};
const chainCache: Record<string, Chain> = {};

// Add cache timeout (e.g., 1 hour)
const CACHE_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
const cacheTimestamps: Record<string, number> = {};

/**
 * Get token info with caching
 */
async function getCachedTokenInfo(chainId: string, tokenId: string) {
  const cacheKey = `${chainId}-${tokenId}`;
  const now = Date.now();

  // Check if cache is valid
  if (
    tokenCache[cacheKey] &&
    (!cacheTimestamps[cacheKey] ||
      now - cacheTimestamps[cacheKey] < CACHE_TIMEOUT)
  ) {
    return tokenCache[cacheKey];
  }

  // If not in cache or expired, fetch and cache
  const token = await getTokenInfo(chainId, tokenId);
  if (token) {
    tokenCache[cacheKey] = {
      decimals: token.decimals,
      ticker: token.ticker,
    };
    cacheTimestamps[cacheKey] = now;
  }
  return token;
}

/**
 * Get chains with caching
 */
async function getCachedChains() {
  const now = Date.now();
  const CHAINS_CACHE_KEY = "all-chains";

  // Check if cache is valid
  if (
    Object.keys(chainCache).length > 0 &&
    (!cacheTimestamps[CHAINS_CACHE_KEY] ||
      now - cacheTimestamps[CHAINS_CACHE_KEY] < CACHE_TIMEOUT)
  ) {
    return chainCache;
  }

  // If not in cache or expired, fetch and cache
  const chains = await getChains();
  if (chains) {
    Object.assign(chainCache, chains);
    cacheTimestamps[CHAINS_CACHE_KEY] = now;
  }
  return chains;
}

/**
 * Batch format multiple amounts at once
 */
export async function formatAssetAmountBatch(
  requests: FormatAssetAmountOptions[]
): Promise<Record<string, FormatAssetAmountResult>> {
  // 1. Pre-fetch all unique chains in one go
  const uniqueChainIds = Array.from(
    new Set(requests.map((req) => req.asset.chainId))
  );
  await getCachedChains();

  // 2. Pre-fetch all unique tokens in parallel
  const tokenRequests = requests.filter(
    (req) => req.asset.type === "token" && req.asset.tokenId
  );
  await Promise.all(
    tokenRequests.map((req) =>
      getCachedTokenInfo(req.asset.chainId, req.asset.tokenId!)
    )
  );

  // 3. Format all amounts using cached data
  const results: Record<string, FormatAssetAmountResult> = {};
  for (const request of requests) {
    const result = await formatAssetAmount(request);
    const key = `${request.asset.chainId}-${request.asset.type}-${
      request.asset.tokenId || ""
    }-${request.amount}`;
    results[key] = result;
  }

  return results;
}

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
      // Use provided chainData (if not null) or cached chains
      const chains = chainData || (await getCachedChains());
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
      if (!asset.tokenId) {
        return { formatted: "0", ticker: "" };
      }

      // Use cached token info
      const token = await getCachedTokenInfo(asset.chainId, asset.tokenId);
      if (!token) {
        return { formatted: "0", ticker: "" };
      }
      decimals = token.decimals;
      ticker = token.ticker;
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

// First, add these type definitions at the top of the file
export type FormatAssetAmountOptions = {
  asset: {
    chainId: string;
    type: "native" | "token";
    tokenId?: string;
  };
  amount: string;
  chainData?: Record<string, Chain> | null; // Allow null
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export type FormatAssetAmountResult = {
  formatted: string;
  ticker: string;
};
