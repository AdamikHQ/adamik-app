import { useQueries } from "@tanstack/react-query";
import { getValidators } from "~/api/validator";

export const useValidatorsBatch = (chainIds: string[]) => {
  return useQueries({
    queries: chainIds.map((chainId) => {
      return {
        queryKey: ["validators", chainId],
        queryFn: async () => getValidators(chainId),
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
