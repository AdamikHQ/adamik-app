"use server";

import { env, COINGECKO_API_URL } from "~/env";

export type getCoinGeckoSimpleTokenPriceResponse = Record<
  string,
  { usd: number }
>;
type CoinGeckoSimpleTokenPrice = {
  chainId: string;
  tokenIds: getCoinGeckoSimpleTokenPriceResponse;
};

export const getCoinGeckoSimpleTokenPrice = async (
  chainId: string,
  tokenIds: string[]
): Promise<CoinGeckoSimpleTokenPrice | null> => {
  const response = await fetch(
    `${COINGECKO_API_URL}/simple/token_price/${chainId}?vs_currencies=usd&contract_addresses=${tokenIds.join(
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
    const data: getCoinGeckoSimpleTokenPriceResponse = await response.json();

    return { chainId: chainId, tokenIds: data };
  }

  return null;
};
