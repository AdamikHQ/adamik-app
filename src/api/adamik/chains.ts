"use server";

import fetch from "node-fetch";
import { ADAMIK_API_URL, env } from "~/env";
import { Chain } from "~/utils/types";

interface ChainsResponse {
  chains: Record<string, Chain>;
}

// TODO Better API error management, consistent for all endpoints
export const getChains = async (): Promise<Record<string, Chain> | null> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch(`${ADAMIK_API_URL}/chains`, {
      headers: {
        Authorization: env.ADAMIK_API_KEY,
      },
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error("chains - backend error:", await response.text());
      return null;
    }

    const data = (await response.json()) as ChainsResponse;

    if (!data || typeof data !== "object" || !("chains" in data)) {
      console.error("Invalid response format from chains API");
      return null;
    }

    return data.chains;
  } catch (error) {
    console.error("Error fetching chains:", error);
    return null;
  }
};
