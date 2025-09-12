import { useQueries } from "@tanstack/react-query";
import { getAllValidators } from "~/api/adamik/validators";

export const useValidatorsBatch = (chainIds: string[]) => {
  console.log(`🎯 [useValidatorsBatch] Fetching validators for chains:`, chainIds);
  
  return useQueries({
    queries: chainIds.map((chainId) => {
      return {
        queryKey: ["validators", chainId],
        queryFn: async () => getAllValidators(chainId),
      };
    }),
    combine: (results) => {
      const data = results.map((result) => result.data);
      console.log(`🎯 [useValidatorsBatch] Results:`, data.map(d => ({
        chainId: d?.chainId,
        validatorCount: d?.validators?.length || 0
      })));
      
      return {
        error: results.map((result) => result.error),
        data,
        isLoading: results.some((result) => result.isLoading),
      };
    },
  });
};
