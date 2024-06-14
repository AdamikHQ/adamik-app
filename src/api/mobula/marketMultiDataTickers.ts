"use server";

import { env, MOBULA_API_URL } from "~/env";
import { MobulaMarketData } from "./types";

export type MobulaMarketMultiDataResponse = Record<string, MobulaMarketData>;

export const getMobulaMarketMultiDataTickers = async (
  tickers: string[]
): Promise<MobulaMarketMultiDataResponse> => {
  const response = await fetch(
    `${MOBULA_API_URL}/market/multi-data?symbols=${tickers.join(",")}`,
    {
      headers: {
        "Content-Type": "application/json",
        "x-cg-demo-api-key": env.MOBULA_API_KEY,
      },
      method: "GET",
    }
  );

  if (response.status === 200) {
    const data: { data: Record<string, MobulaMarketData> } =
      await response.json();

    return data.data;
  }

  return {};
};
