import { useQueries } from "@tanstack/react-query";
import { GetAddressState } from "~/api/addressState";

type GetAddressStateParams = {
  chainId: string;
  address: string;
};

export const useGetAddressDataBatch = (
  addressesParams: GetAddressStateParams[]
) => {
  return useQueries({
    queries: addressesParams.map(({ chainId, address }) => {
      return {
        queryKey: ["addressData", chainId, address],
        queryFn: async () => GetAddressState(chainId, address),
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
