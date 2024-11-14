"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { FinalizedTransaction } from "~/utils/types";

interface AccountHistoryResponse {
  chainId: string;
  accountId: string;
  transactions: FinalizedTransaction[];
  pagination?: {
    nextPage: string | null;
  };
}

export const getAccountHistory = async (
  chainId: string | undefined,
  accountId: string | undefined,
  options?: {
    nextPage?: string;
  }
): Promise<AccountHistoryResponse | null> => {
  if (!chainId || !accountId) {
    return null;
  }

  const response = await fetch(`${ADAMIK_API_URL}/account/history`, {
    method: "POST",
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chainId,
      accountId,
      nextPage: options?.nextPage,
    }),
  });

  const result = await response.json();

  if (response.status === 200) {
    return result;
  } else {
    console.error("Account history - backend error:", JSON.stringify(result));
    return null;
  }
};
