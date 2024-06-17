"use server";

import { env, MOBULA_API_URL } from "~/env";
import { MobulaMarketData } from "./types";

export type MobulaMarketMultiDataTickersResponse = Record<
  string,
  MobulaMarketData
>;

export const getMobulaMarketMultiDataTickers = async (
  tickers: string[]
): Promise<MobulaMarketMultiDataTickersResponse> => {
  const url = `${MOBULA_API_URL}/market/multi-data?symbols=${tickers.join(
    ","
  )}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: env.MOBULA_API_KEY,
    },
    method: "GET",
  });

  if (response.status === 200) {
    const data: { data: Record<string, MobulaMarketData> } =
      await response.json();

    return data.data;
  }

  return {};
};
