"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { Transaction, TransactionData } from "~/utils/types";

// TODO Better API error management, consistent for all endpoints
export const transactionEncode = async (
  transactionData: TransactionData
): Promise<Transaction> => {
  const response = await fetch(`${ADAMIK_API_URL}/transaction/encode`, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ transaction: { data: transactionData } }),
  });

  const {
    transaction,
    message,
  }: { transaction: Transaction; message: string } = await response.json();

  const messageString = message && JSON.stringify(message);

  if (messageString) {
    console.error("encode - backend error:", messageString);
    throw new Error(messageString);
  }

  return transaction;
};
