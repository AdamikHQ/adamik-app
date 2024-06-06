"use server";

import { env, ADAMIK_API_URL } from "~/env";

export type getSupportedChainsIdsResponse = {
  chains: string[];
};

export const getSupportedChainsIds =
  async (): Promise<getSupportedChainsIdsResponse | null> => {
    const response = await fetch(`${ADAMIK_API_URL}/chains`, {
      headers: {
        Authorization: env.ADAMIK_API_KEY,
        "Content-Type": "application/json",
      },
      method: "GET",
    });

    if (response.status === 200) {
      const data: getSupportedChainsIdsResponse = await response.json();

      return data;
    }

    return null;
  };
