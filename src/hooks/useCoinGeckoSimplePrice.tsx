import { useQuery } from "@tanstack/react-query";
import { getCoinGeckoSimplePrice } from "~/api/coingecko/simplePrice";

export const useCoinGeckoSimplePrice = (chainIds: string[]) => {
  return useQuery({
    queryKey: ["getCoinGeckoSimplePrice", chainIds],
    queryFn: async () => getCoinGeckoSimplePrice(chainIds),
  });
};
