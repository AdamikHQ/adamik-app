import { useQuery } from "@tanstack/react-query";
import { accountState } from "~/api/adamik/accountState";
import { queryClientGlobal } from "~/providers/QueryProvider";

type GetAddressStateParams = {
  chainId: string;
  address: string;
};

export const clearAccountStateCache = ({
  chainId,
  address,
}: GetAddressStateParams) => {
  queryClientGlobal.invalidateQueries({
    queryKey: ["accountState", chainId, address],
  });
};

export const useAccountState = ({
  chainId,
  address,
}: GetAddressStateParams) => {
  return useQuery({
    queryKey: ["accountState", chainId, address],
    queryFn: async () => accountState(chainId, address),
  });
};
