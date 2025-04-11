import { useQueries, useQueryClient } from "@tanstack/react-query";
import { accountState } from "~/api/adamik/accountState";
import { queryCache, queryClientGlobal } from "~/providers/QueryProvider";
import { useMemo } from "react";

type GetAddressStateParams = {
  chainId: string;
  address: string;
};

export const isInAccountStateBatchCache = (
  addresses: GetAddressStateParams[]
) => {
  return addresses.every(({ chainId, address }) => {
    return queryCache.find({ queryKey: ["accountState", chainId, address] });
  });
};

// TODO Response should be typed
export const useAccountStateBatch = (
  addressesParams: GetAddressStateParams[]
) => {
  // Memoize the query configurations to prevent unnecessary recreations
  const queryConfigs = useMemo(
    () =>
      addressesParams.map(({ chainId, address }) => ({
        queryKey: ["accountState", chainId, address],
        queryFn: async () => accountState(chainId, address),
        staleTime: 30000, // Consider data fresh for 30 seconds
        cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
      })),
    [addressesParams]
  );

  const results = useQueries({
    queries: queryConfigs,
    combine: (results) => {
      return {
        error: results.map((result) => result.error),
        data: results.map((result) => result.data),
        isLoading: results.some((result) => result.isLoading),
      };
    },
  });

  return results;
};

export const clearAccountStateCache = ({
  chainId,
  address,
}: GetAddressStateParams) => {
  queryClientGlobal.invalidateQueries({
    queryKey: ["accountState", chainId, address],
  });
};
