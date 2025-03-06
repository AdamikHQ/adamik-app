"use server";

import fetch from "node-fetch";
import { env, MOBULA_API_URL } from "~/env";
import { MobulaMarketData } from "./types";

export type MobulaMarketMultiDataResponse = Record<string, MobulaMarketData>;

export const getMobulaMarketMultiData = async (
  tickers: string[],
  type: "assets" | "symbols"
): Promise<MobulaMarketMultiDataResponse> => {
  const url = `${MOBULA_API_URL}/market/multi-data?${type}=${tickers.join(
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
    const data = (await response.json()) as {
      data: Record<string, MobulaMarketData>;
    };
    return data.data;
  }

  return {};
};
