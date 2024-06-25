"use server";

import { env, COINGECKO_API_URL } from "~/env";
import { CoinGeckoCoin } from "./types";

export type getCoinGeckoCoinListResponse = Array<CoinGeckoCoin>;

export const getCoinGeckoCoinList =
  async (): Promise<getCoinGeckoCoinListResponse> => {
    let allData: getCoinGeckoCoinListResponse = [];
    const pages = 23; // To get the first 5750 coins (250 coins per page x 23 pages)

    for (let page = 1; page <= pages; page++) {
      const response = await fetch(
        `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}`,
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
        allData = allData.concat(data);
      } else {
        console.error(
          `Failed to fetch data for page ${page}: ${response.status}`
        );
      }
    }

    return allData;
  };
