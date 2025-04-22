import { useQueries, useQuery } from "@tanstack/react-query";
import { accountState } from "~/api/adamik/accountState";
import { queryCache, queryClientGlobal } from "~/providers/QueryProvider";

type GetAddressStateParams = {
  chainId: string;
  address: string;
  pubKey?: string;
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
  return useQueries({
    queries: addressesParams.map(({ chainId, address, pubKey }) => {
      return {
        queryKey: ["accountState", chainId, address],
        queryFn: async () => accountState(chainId, address, pubKey),
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

export const useAccountState = (
  chainId: string,
  address: string,
  pubkey?: string
) => {
  return useQuery({
    queryKey: ["accountState", chainId, address],
    queryFn: async () => accountState(chainId, address, pubkey),
  });
};

export const clearAccountStateCache = ({
  chainId,
  address,
}: GetAddressStateParams) => {
  queryClientGlobal.invalidateQueries({
    queryKey: ["accountState", chainId, address],
  });
};
