"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { Transaction, BackendErrorResponse } from "~/utils/types";

export type BroadcastResponse = {
  hash?: string;
  error?: BackendErrorResponse;
};

// TODO Better API error management, consistent for all endpoints
export const broadcast = async (
  transaction: Transaction
): Promise<BroadcastResponse> => {
  const response = await fetch(`${ADAMIK_API_URL}/transaction/broadcast`, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ transaction }),
  });

  const result = await response.json();
  if (response.status !== 200) {
    console.error("broadcast - backend error:", JSON.stringify(result));
    return { error: result as BackendErrorResponse };
  }

  return { hash: result.hash };
};
