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
      
      // Special logging for Solana
      const solanaData = data.find(d => d?.chainId === 'solana');
      if (solanaData) {
        console.log(`🔍 [useValidatorsBatch] Solana validators count:`, solanaData.validators?.length);
        console.log(`🔍 [useValidatorsBatch] First 3 Solana validators:`, solanaData.validators?.slice(0, 3));
      }
      
      return {
        error: results.map((result) => result.error),
        data,
        isLoading: results.some((result) => result.isLoading),
      };
    },
  });
};
