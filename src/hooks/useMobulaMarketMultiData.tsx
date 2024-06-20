import { useQueries } from "@tanstack/react-query";
import { getMobulaMarketMultiData } from "~/api/mobula/marketMultiData";

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
}

export const useMobulaMarketMultiData = (
  tickerIds: string[],
  enabled: boolean,
  type: "assets" | "symbols"
) => {
  const queries = chunkArray(tickerIds, 200).map((chunk) => {
    console.log({ chunk });
    return {
      queryKey: ["useMobulaMarketMultiData", chunk, type],
      queryFn: async () => getMobulaMarketMultiData(chunk, type),
      enabled,
    };
  });

  return useQueries({
    queries,
    combine: (results) => {
      return {
        error: results.map((result) => result.error),
        data: results.reduce((acc, result) => {
          return { ...acc, ...result.data };
        }, {}),
        isLoading: results.some((result) => result.isLoading),
      };
    },
  });
};
