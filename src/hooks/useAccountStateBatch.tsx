import { useQueries } from "@tanstack/react-query";
import { accountState } from "~/api/adamik/accountState";
import { queryClientGlobal } from "~/providers/QueryProvider"; // Use the correct import

type GetAddressStateParams = {
  chainId: string;
  address: string;
};

export const isInAccountStateBatchCache = (
  addresses: GetAddressStateParams[]
) => {
  return addresses.every(({ chainId, address }) => {
    return queryClientGlobal
      .getQueryCache()
      .find({ queryKey: ["accountState", chainId, address] });
  });
};

// Function to clear specific account state cache
export const clearAccountStateCache = ({
  chainId,
  address,
}: GetAddressStateParams) => {
  queryClientGlobal.removeQueries({
    queryKey: ["accountState", chainId, address],
  });
};

// Use account state batch hook to fetch multiple account states
export const useAccountStateBatch = (
  addressesParams: GetAddressStateParams[]
) => {
  return useQueries({
    queries: addressesParams.map(({ chainId, address }) => {
      return {
        queryKey: ["accountState", chainId, address],
        queryFn: async () => accountState(chainId, address),
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
