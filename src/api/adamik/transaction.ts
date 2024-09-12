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
    `${ADAMIK_API_URL}/chains/${chainId}/transaction/${transactionId}`,
    {
      headers: {
        Authorization: env.ADAMIK_API_KEY,
        "Content-Type": "application/json",
      },
      method: "GET",
    }
  );

  const result = await response.json();

  if (response.status === 200) {
    return result;
  } else {
    console.error("state - backend error:", JSON.stringify(result));
    throw new Error(result.message);
  }
};
