"use server";

import { env, ADAMIK_API_URL } from "~/env";

export type GetAddressStateResponse = {
  balances: {
    native: { available: string };
    tokens: {
      value: string;
      token: {
        chainId: string;
        contractAddress: string;
        decimals: number;
        id: string;
        name: string;
        ticker: string;
        type: string;
      };
    }[];
  };
  chainId: string;
};

export const addressState = async (
  chainId: string,
  address: string
): Promise<GetAddressStateResponse | null> => {
  const response = await fetch(`${ADAMIK_API_URL}/address/state`, {
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
