"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { FinalizedTransaction } from "~/utils/types";

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

  const result = await response.json();

  if (response.status !== 200 || !result.transaction) {
    console.error("state - backend error:", JSON.stringify(result));
    return null;
  } else {
    return result.transaction;
  }
};
