import { useQuery } from "@tanstack/react-query";
import { getMobulaMarketMultiDataTickers } from "~/api/mobula/marketMultiDataTickers";

export const useMobulaMarketMultiDataTickers = (
  tickerIds: string[],
  enabled: boolean
) => {
  return useQuery({
    queryKey: ["getMobulaMarketMultiDataTickers", tickerIds],
    queryFn: async () => getMobulaMarketMultiDataTickers(tickerIds),
    enabled: enabled,
  });
};
