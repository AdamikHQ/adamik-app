import { useQueries } from "@tanstack/react-query";
import { getChainDetails } from "~/api/adamik/chainDetails";

// NOTE - DEPRECATED - useChains should be used instead

export const useGetChainDetailsBatch = (chainIds: string[]) => {
  return useQueries({
    queries: chainIds.map((chainId) => {
      return {
        queryKey: ["getChainDetails", chainId],
        queryFn: async () => getChainDetails(chainId),
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
