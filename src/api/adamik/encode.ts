"use server";

import fetch from "node-fetch";
import { env, ADAMIK_API_URL } from "~/env";
import { Status, Transaction, TransactionData } from "~/utils/types";

export const transactionEncode = async (
  transactionData: TransactionData
): Promise<{
  chainId: string;
  transaction: Transaction;
  status: Status;
// TODO Better API error management, consistent for all endpoints
}> => {
  const response = await fetch(
    `${ADAMIK_API_URL}/${transactionData.chainId}/transaction/encode`,
    {
      headers: {
        Authorization: env.ADAMIK_API_KEY,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ transaction: { data: transactionData } }),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = (await response.json()) as {
    chainId: string;
    transaction: Transaction;
    status: Status;
  };
  return result;
};
