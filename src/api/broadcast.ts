"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { Transaction } from "~/utils/types";

type BroadcastArgs = {
  transaction: Transaction;
  signature: string;
  encodedTransaction?: string;
};

export type BroadcastResponse = {
  hash: string;
  error?: { message: string };
};

export const broadcast = async ({
  transaction,
  signature,
  encodedTransaction,
}: BroadcastArgs): Promise<BroadcastResponse> => {
  const response = await fetch(`${ADAMIK_API_URL}/transaction/broadcast`, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      transaction: {
        plain: transaction,
        encoded: encodedTransaction,
        signature,
      },
    }),
  });

  if (response.status !== 200) {
    console.error("broadcast - backend error:", response.statusText);
  }

  const result = (await response.json()) as BroadcastResponse;
  return result;
};
