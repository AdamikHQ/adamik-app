"use server";

import { env, COINGECKO_API_URL } from "~/env";

export type getCoinGeckoSimplePriceResponse = Record<string, { usd: number }>;

export const getCoinGeckoSimplePrice = async (
  chainIds: string[]
): Promise<getCoinGeckoSimplePriceResponse | null> => {
  const response = await fetch(
    `${COINGECKO_API_URL}/simple/price?vs_currencies=usd&ids=${chainIds.join(
      ","
    )}`,
    {
      headers: {
        "Content-Type": "application/json",
        "x-cg-demo-api-key": env.COINGECKO_API_KEY,
      },
      method: "GET",
    }
  );

  if (response.status === 200) {
    const data: getCoinGeckoSimplePriceResponse = await response.json();

    return data;
  }

  return null;
};
