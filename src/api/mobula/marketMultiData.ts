"use server";

import { env, MOBULA_API_URL } from "~/env";
import { MobulaMarketData } from "./types";

export type MobulaMarketMultiDataResponse = {
  chainId: string;
  data: Record<string, MobulaMarketData>;
};

export const getMobulaMarketMultiData = async (
  chainId: string,
  tickers: string[]
): Promise<MobulaMarketMultiDataResponse> => {
  const response = await fetch(
    `${MOBULA_API_URL}/market/multi-data?symbols=${tickers.join(",")}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: env.MOBULA_API_KEY,
      },
      method: "GET",
    }
  );

  if (response.status === 200) {
    const data: { data: Record<string, MobulaMarketData> } =
      await response.json();

    return { chainId, data: data.data };
  }

  return { chainId, data: {} };
};
