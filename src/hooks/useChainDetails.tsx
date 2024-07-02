import { useQuery } from "@tanstack/react-query";
import { getChainDetails } from "~/api/chainDetails";

export const useChainDetails = (chainId: string | undefined) => {
  return useQuery({
    queryKey: ["chain", chainId],
    queryFn: async () => getChainDetails(chainId as string),
    enabled: !!chainId,
  });
};
