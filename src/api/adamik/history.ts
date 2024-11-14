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
  options?: { nextPage?: string }
): Promise<AccountHistoryResponse | null> => {
  if (!chainId || !accountId) return null;

  const url = new URL(`${ADAMIK_API_URL}/account/history`);
  if (options?.nextPage) url.searchParams.set("nextPage", options.nextPage);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chainId, accountId }),
  });

  const result = await response.json();
  return response.status === 200 ? result : null;
};
