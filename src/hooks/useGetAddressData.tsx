import { useQuery } from "@tanstack/react-query";
import { getAddressData } from "~/api/data";

type GetAddressDataParams = {
  chainId: string;
  address: string;
};

export const useGetAddressData = ({
  chainId,
  address,
}: GetAddressDataParams) => {
  return useQuery({
    queryKey: ["addressData", chainId, address],
    queryFn: async () => getAddressData(chainId, address),
  });
};
