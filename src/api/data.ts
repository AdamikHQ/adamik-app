"use server";

import { env, ADAMIK_API_URL } from "~/env";

type GetAddressDataResponse = {
  balances: {
    native: { available: string };
    tokens: { value: string; tokenId: string }[];
  };
  chainId: string;
};

export const getAddressData = async (
  chainId: string,
  address: string
): Promise<GetAddressDataResponse | null> => {
  const response = await fetch(`${ADAMIK_API_URL}/data/state`, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ chainId, address }),
  });

  if (response.status === 200) {
    const data = await response.json();
    return data;
  } else {
    console.error("state - backend error:", response.json());
    return null;
  }
};
