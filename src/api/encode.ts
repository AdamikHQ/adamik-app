"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { Transaction } from "~/utils/types";

export type TransactionEncodeResponse = {
  plain: Transaction;
  encoded: string;
};

export const transactionEncode = async (
  plainTransaction: Transaction
): Promise<TransactionEncodeResponse | null> => {
  const response = await fetch(`${ADAMIK_API_URL}/transaction/encode`, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ transaction: { plain: plainTransaction } }),
  });

  if (response.status === 200) {
    const data: TransactionEncodeResponse = await response.json();
    return data;
  } else {
    console.error("encode - backend error:", response.statusText);
  }
  return null;
};
