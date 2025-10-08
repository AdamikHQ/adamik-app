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

  // Create an AbortController to handle request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: env.ADAMIK_API_KEY,
      },
      signal: controller.signal as any,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("state - backend error:", await response.text());
      return null;
    }

    return response.json() as Promise<AccountState>;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Request timeout for ${chainId}:${accountId}`);
    } else {
      console.error(
        `Error fetching account state for ${chainId}:${accountId}:`,
        error
      );
    }
    return null;
  }
};
