import { useQueries } from "@tanstack/react-query";
import { getCoinGeckoSimpleTokenPrice } from "~/api/coingecko/simpleTokenPrice";

type CoinGeckoSimpleTokenPriceBatchParams = Record<string, string[]>;

export const useCoinGeckoSimpleTokenPriceBatch = (
  chainTokenIds: CoinGeckoSimpleTokenPriceBatchParams
) => {
  return useQueries({
    queries: Object.keys(chainTokenIds).map((chainId) => {
      return {
        queryKey: [
          "getCoinGeckoSimpleTokenPrice",
          chainId,
          chainTokenIds[chainId],
        ],
        queryFn: async () =>
          getCoinGeckoSimpleTokenPrice(chainId, chainTokenIds[chainId]),
      };
    }),
    combine: (results) => {
      return {
        error: results.map((result) => result.error),
        data: results.map((result) => result.data),
        isLoading: results.some((result) => result.isLoading),
      };
    },
  });
};
