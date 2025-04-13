import { useQuery } from "@tanstack/react-query";
import { getChains } from "~/api/adamik/chains";
import { Chain } from "~/utils/types";

export const CHAINS_QUERY_KEY = ["chains"] as const;

export const useChains = () => {
  return useQuery<Record<string, Chain> | null>({
    queryKey: CHAINS_QUERY_KEY,
    queryFn: async () => getChains(),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 3,
  });
};
