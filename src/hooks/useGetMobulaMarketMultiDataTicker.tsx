import { useQuery } from "@tanstack/react-query";
import { getMobulaMarketMultiDataTickers } from "~/api/mobula/marketMultiDataTickers";

export const useMobulaMarketMultiDataTickers = (tickerIds: string[]) => {
  return useQuery({
    queryKey: ["getMobulaMarketMultiDataTickers", tickerIds],
    queryFn: async () => getMobulaMarketMultiDataTickers(tickerIds),
  });
};
