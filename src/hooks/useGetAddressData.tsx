import { useQuery } from "@tanstack/react-query";
import { GetAddressState } from "~/api/addressState";

type GetAddressStateParams = {
  chainId: string;
  address: string;
};

export const useGetAddressState = ({
  chainId,
  address,
}: GetAddressStateParams) => {
  return useQuery({
    queryKey: ["addressData", chainId, address],
    queryFn: async () => GetAddressState(chainId, address),
  });
};
