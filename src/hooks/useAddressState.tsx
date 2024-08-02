import { useQuery } from "@tanstack/react-query";
import { addressState } from "~/api/adamik/addressState";
import { queryClientGlobal } from "~/providers/QueryProvider";

type GetAddressStateParams = {
  chainId: string;
  address: string;
};

export const clearAddressStateCache = ({
  chainId,
  address,
}: GetAddressStateParams) => {
  queryClientGlobal.invalidateQueries({
    queryKey: ["addressState", chainId, address],
  });
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
