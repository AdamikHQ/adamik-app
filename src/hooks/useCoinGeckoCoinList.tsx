import { useQuery } from "@tanstack/react-query";
import { getCoinGeckoCoinList } from "~/api/coingecko/coinList";

export const useGetCoinGeckoCoinList = () => {
  return useQuery({
    queryKey: ["coinGeckoCoinList"],
    queryFn: async () => getCoinGeckoCoinList(),
  });
};
