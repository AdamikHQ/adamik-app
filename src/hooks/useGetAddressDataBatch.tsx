import { useQueries } from "@tanstack/react-query";
import { getAddressData } from "~/api/data";

type GetAddressDataParams = {
  chainId: string;
  address: string;
};

export const useGetAddressDataBatch = (
  addressesParams: GetAddressDataParams[]
) => {
  return useQueries({
    queries: addressesParams.map(({ chainId, address }) => {
      return {
        queryKey: ["addressData", chainId, address],
        queryFn: async () => getAddressData(chainId, address),
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
