"use server";

import { env, ADAMIK_API_URL } from "~/env";

interface Token {
  chainId: string;
  type: string;
  id: string;
  name: string;
  ticker: string;
  decimals: number;
  contractAddress?: string;
}

interface TokenAmount {
  amount: string;
  value: string;
  token: Token;
}

interface ValidatorPosition {
  validatorAddresses: string[];
  amount: string;
  status: string;
  completionDate?: number;
}

interface Reward {
  tokenId?: string;
  validatorAddress: string;
  amount: string;
}

interface Balances {
  native: {
    available: string;
    total: string;
  };
  tokens: TokenAmount[];
  staking?: {
    total: string;
    locked: string;
    unlocking: string;
    unlocked: string;
    positions?: ValidatorPosition[];
    rewards: {
      native: Reward[];
      tokens: Reward[];
    };
  };
}

export type GetAddressStateResponse = {
  chainId: string;
  address: string;
  balances: Balances;
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
    console.error("state - backend error");
    return null;
  }
};
