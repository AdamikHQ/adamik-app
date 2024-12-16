"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { Status, Transaction, TransactionData } from "~/utils/types";

type TransactionResponse = {
  chainId: string;
  transaction: Transaction;
  status: Status;
};

// TODO Better API error management, consistent for all endpoints
export const transactionEncode = async (
  transactionData: TransactionData
): Promise<TransactionResponse> => {
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

  const result: { chainId: string; transaction: Transaction; status: Status } =
    await response.json();

  return result;
};
