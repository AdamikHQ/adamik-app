"use server";

import fetch from "node-fetch";
import { ADAMIK_API_URL, env } from "~/env";
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
    const error = (await response.json()) as {
      status: { errors: { message: string }[] };
    };

    if (error.status.errors.length > 0) {
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${error.status.errors[0].message}`
      );
    }
  }

  const result = (await response.json()) as {
    chainId: string;
    transaction: Transaction;
    status: Status;
  };
  return result;
};

export const encodePubKeyToAddress = async (
  pubKey: string,
  chainId: string
) => {
  try {
    const response = await fetch(
      `${ADAMIK_API_URL}/${chainId}/address/encode`,
      {
        method: "POST",
        headers: {
          Authorization: env.ADAMIK_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pubkey: pubKey,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = (await response.json()) as {
      status?: {
        errors: Array<{ message: string }>;
      };
      addresses?: Array<{
        address: string;
        type: string;
      }>;
    };

    if (
      result.status &&
      result.status.errors &&
      result.status.errors.length > 0
    ) {
      throw new Error(result.status.errors[0].message);
    }

    const addresses = result.addresses;

    if (!addresses || addresses.length === 0) {
      throw new Error("No addresses found for the given public key");
    }

    // In browser context, we'll always use the first address
    // This is typically the most common/default address format for the chain
    return {
      address: addresses[0].address,
      type: addresses[0].type,
      allAddresses: addresses,
    };
  } catch (error) {
    console.error(`Error encoding pubkey to address:`, error);
    throw error;
  }
};
