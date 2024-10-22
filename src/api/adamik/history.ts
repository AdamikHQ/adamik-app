"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { FinalizedTransaction } from "~/utils/types";

interface AccountHistoryResponse {
  chainId: string;
  accountId: string;
  transactions: FinalizedTransaction[];
}

export const getAccountHistory = async (
  chainId: string | undefined,
  accountId: string | undefined
): Promise<AccountHistoryResponse | null> => {
  if (!chainId || !accountId) {
    return null;
  }

  const response = await fetch(
    `${ADAMIK_API_URL}/api/account/history?include=parsed`,
    {
      method: "POST",
      headers: {
        Authorization: env.ADAMIK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chainId,
        accountId,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error(
      "Account history - backend error:",
      JSON.stringify(errorData)
    );
    throw new Error(`Failed to fetch account history: ${response.statusText}`);
  }

  const result: AccountHistoryResponse = await response.json();
  return result;
};
