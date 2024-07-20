"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { Transaction } from "~/utils/types";

export type BroadcastResponse = {
  hash: string;
  error?: { message: string };
};

// TODO Better API error management, consistent for for all endpoints
export const broadcast = async (
  transaction: Transaction
): Promise<BroadcastResponse> => {
  const response = await fetch(`${ADAMIK_API_URL}/transaction/broadcast`, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      transaction: { transaction },
    }),
  });

  if (response.status !== 200) {
    console.error("broadcast - backend error:", response.statusText);
  }

  const result = (await response.json()) as BroadcastResponse;
  return result;
};
