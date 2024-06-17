import { useQueries } from "@tanstack/react-query";
import { getMobulaMarketMultiData } from "~/api/mobula/marketMultiData";

type CoinGeckoSimpleTokenPriceBatchParams = Record<string, string[]>;

export const useGetMobulaMarketMultiDataBatch = (
  chainTokenIds: CoinGeckoSimpleTokenPriceBatchParams
) => {
  return useQueries({
    queries: Object.keys(chainTokenIds).map((chainId) => {
      return {
        queryKey: [
          "useGetMobulaMarketMultiDataBatch",
          chainId,
          chainTokenIds[chainId],
        ],
        queryFn: async () =>
          getMobulaMarketMultiData(chainId, chainTokenIds[chainId]),
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
