import { useQueries } from "@tanstack/react-query";
import {
  getMobulaMarketMultiData,
  MobulaMarketMultiDataResponse,
} from "~/api/mobula/marketMultiData";

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
}

/**
 * Special cases to override default Mobula API behavior.
 * Some tokens require specific query parameters or asset types
 * to fetch their correct market data from the API.
 */
const SPECIAL_CASES: Record<
  string,
  { queryParam: string; type: "assets" | "symbols" }
> = {
  LIKE: { queryParam: "likecoin", type: "assets" },
  LUM: { queryParam: "Lum Network", type: "assets" },
};

export const useMobulaMarketMultiData = (
  tickerIds: string[],
  enabled: boolean,
  type: "assets" | "symbols"
) => {
  const queries = chunkArray(tickerIds, 200).map((chunk) => ({
    queryKey: ["useMobulaMarketMultiData", chunk, type],
    queryFn: async () => {
      const specialTokens = chunk.filter((token) => SPECIAL_CASES[token]);
      if (specialTokens.length > 0) {
        const regularChunk = chunk.filter((token) => !SPECIAL_CASES[token]);

        const results = await Promise.all([
          regularChunk.length > 0
            ? getMobulaMarketMultiData(regularChunk, type)
            : ({} as MobulaMarketMultiDataResponse),
          ...specialTokens.map((token) =>
            getMobulaMarketMultiData(
              [SPECIAL_CASES[token].queryParam],
              SPECIAL_CASES[token].type
            )
          ),
        ]);

        const specialTokensData =
          specialTokens.reduce<MobulaMarketMultiDataResponse>(
            (acc, token, index) => ({
              ...acc,
              [token]: results[index + 1]?.[SPECIAL_CASES[token].queryParam],
            }),
            {}
          );

        return {
          ...results[0],
          ...specialTokensData,
        };
      }

      return getMobulaMarketMultiData(chunk, type);
    },
    enabled,
  }));

  return useQueries({
    queries,
    combine: (results) => ({
      error: results.map((result) => result.error),
      data: results.reduce((acc, result) => ({ ...acc, ...result.data }), {}),
      isLoading: results.some((result) => result.isLoading),
    }),
  });
};
