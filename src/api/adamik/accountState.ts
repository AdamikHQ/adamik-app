"use server";

import { ADAMIK_API_URL, env } from "~/env";
import { AccountState } from "~/utils/types";

// TODO Better API error management, consistent for all endpoints
export const accountState = async (
  chainId: string,
  accountId: string
): Promise<AccountState | null> => {
  const response = await fetch(
    `${ADAMIK_API_URL}/${chainId}/account/${accountId}/state`,
    {
      headers: {
        Authorization: env.ADAMIK_API_KEY,
        "Content-Type": "application/json",
      },
      method: "GET",
    }
  );

  const result = await response.json();

  if (response.status === 200) {
    return result;
  } else {
    console.error("state - backend error:", JSON.stringify(result));
    return null;
  }
};
