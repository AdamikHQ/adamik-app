import { useQueries } from "@tanstack/react-query";
import { addressState } from "~/api/adamik/addressState";
import { queryCache } from "~/providers/QueryProvider";

type GetAddressStateParams = {
  chainId: string;
  address: string;
};

export const isAddressStateCache = (addresses: GetAddressStateParams[]) => {
  return addresses.every(({ chainId, address }) => {
    return queryCache.find({ queryKey: ["addressState", chainId, address] });
  });
};

// TODO Response should be typed
export const useAddressStateBatch = (
  addressesParams: GetAddressStateParams[]
) => {
  return useQueries({
    queries: addressesParams.map(({ chainId, address }) => {
      return {
        queryKey: ["addressState", chainId, address],
        queryFn: async () => addressState(chainId, address),
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
