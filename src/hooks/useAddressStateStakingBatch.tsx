import { useQueries } from "@tanstack/react-query";
import { getStaking } from "~/api/staking";

export const useAddressStateBatchStakingBatch = () => {
  return useQueries({
    queries: [1, 2].map((i) => {
      return {
        queryKey: ["addressStateStaking", i],
        queryFn: async () => getStaking(),
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
