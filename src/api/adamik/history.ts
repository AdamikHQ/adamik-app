"use server";

import fetch from "node-fetch";
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

  const url = new URL(
    `${ADAMIK_API_URL}/${chainId}/account/${accountId}/history`
  );
  if (options?.nextPage) url.searchParams.set("nextPage", options.nextPage);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error("history - backend error:", await response.text());
    return null;
  }

  const result = (await response.json()) as AccountHistoryResponse;
  return result;
};
