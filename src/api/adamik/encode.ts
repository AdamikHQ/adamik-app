"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { Transaction, PlainTransaction } from "~/utils/types";

// TODO Better API error management, consistent for for all endpoints
export const transactionEncode = async (
  plainTransaction: PlainTransaction
): Promise<Transaction | null> => {
  const response = await fetch(`${ADAMIK_API_URL}/transaction/encode`, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ transaction: { plain: plainTransaction } }),
  });

  if (response.status === 200) {
    const { transaction }: { transaction: Transaction } = await response.json();
    return transaction;
  } else {
    console.error("encode - backend error");
    return null;
  }
};
