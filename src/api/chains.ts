"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { Chain } from "~/utils/types";

export type getSupportedChainsIdsResponse = {
  chains: Record<string, Chain>;
};

export const getChains =
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
