"use server";

import fetch from "node-fetch";
import { ADAMIK_API_URL, env } from "~/env";
import { AccountState } from "~/utils/types";

// TODO Better API error management, consistent for all endpoints
export const accountState = async (
  chainId: string,
  accountId: string
): Promise<AccountState | null> => {
  const url = `${ADAMIK_API_URL}/${chainId}/account/${accountId}/state`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: env.ADAMIK_API_KEY,
    },
  });

  if (!response.ok) {
    console.error("state - backend error:", await response.text());
    return null;
  }

  return response.json() as Promise<AccountState>;
};
