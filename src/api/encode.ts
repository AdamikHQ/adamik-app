"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { Transaction } from "~/utils/types";

export type TransactionEncodeResponse = {
  transaction: {
    plain: Transaction;
    encoded: string;
    status: { errors: { message: string }[]; warnings: { message: string }[] };
  };
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
    const errors = await response.json();
    console.error("encode - backend error:", JSON.stringify(errors));
    throw new Error(JSON.stringify(errors));
  }
};
