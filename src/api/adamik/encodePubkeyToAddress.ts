"use server";

import fetch from "node-fetch";
import { ADAMIK_API_URL, env } from "~/env";

export const encodePubkeyToAddress = async (
  chainId: string,
  pubkey: string
): Promise<{
  chainId: string;
  pubkey: string;
  addresses: { type: string; address: string }[];
  // TODO Better API error management, consistent for all endpoints
}> => {
  const response = await fetch(`${ADAMIK_API_URL}/${chainId}/address/encode`, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ pubkey }),
  });

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
    pubkey: string;
    addresses: { type: string; address: string }[];
  };
  return result;
};
