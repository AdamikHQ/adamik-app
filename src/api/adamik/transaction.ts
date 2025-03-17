"use server";

import fetch from "node-fetch";
import { env, ADAMIK_API_URL } from "~/env";
import { FinalizedTransaction } from "~/utils/types";

interface ApiResponse {
  transaction: FinalizedTransaction;
}

// TODO Better API error management, consistent for all endpoints
export const getTransaction = async (
  chainId: string | undefined,
  transactionId: string | undefined
): Promise<FinalizedTransaction | null> => {
  if (!chainId || !transactionId) {
    return null;
  }

  const response = await fetch(
    `${ADAMIK_API_URL}/${chainId}/transaction/${transactionId}?include=raw,parsed`,
    {
      headers: {
        Authorization: env.ADAMIK_API_KEY,
      },
      method: "GET",
    }
  );

  if (!response.ok) {
    console.error("state - backend error:", await response.text());
    return null;
  }

  const result = (await response.json()) as ApiResponse;
  return result.transaction || null;
};
