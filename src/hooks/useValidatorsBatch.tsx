import { useQueries } from "@tanstack/react-query";
import { getAllValidators } from "~/api/adamik/validators";

export const useValidatorsBatch = (chainIds: string[]) => {
  return useQueries({
    queries: chainIds.map((chainId) => {
      return {
        queryKey: ["validators", chainId],
        queryFn: async () => getAllValidators(chainId),
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
