"use server";

import { env, COINGECKO_API_URL } from "~/env";
import { CoinGeckoCoin } from "~/lib/types";

export type getCoinGeckoCoinListResponse = Array<CoinGeckoCoin>;

export const getCoinGeckoCoinList =
  async (): Promise<getCoinGeckoCoinListResponse> => {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-cg-demo-api-key": env.COINGECKO_API_KEY,
        },
        method: "GET",
      }
    );

    if (response.status === 200) {
      const data: getCoinGeckoCoinListResponse = await response.json();

      return data;
    }

    return [];
  };
