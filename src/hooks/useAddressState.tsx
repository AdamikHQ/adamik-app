import { useQuery } from "@tanstack/react-query";
import { addressState } from "~/api/addressState";

type GetAddressStateParams = {
  chainId: string;
  address: string;
};

export const useAddressState = ({
  chainId,
  address,
}: GetAddressStateParams) => {
  return useQuery({
    queryKey: ["addressState", chainId, address],
    queryFn: async () => addressState(chainId, address),
  });
};
