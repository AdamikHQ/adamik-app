"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { AddressState } from "~/utils/types";

// TODO Better API error management, consistent for for all endpoints
export const addressState = async (
  chainId: string,
  address: string
): Promise<AddressState | null> => {
  const response = await fetch(`${ADAMIK_API_URL}/address/state`, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ chainId, address }),
  });

  if (response.status === 200) {
    return await response.json();
  } else {
    console.error("state - backend error");
    return null;
  }
};
