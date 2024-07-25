"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { Chain } from "~/utils/types";

type GetChainsResponse = {
  chains: Record<string, Chain>;
};

// TODO Better API error management, consistent for all endpoints
export const getChains = async (): Promise<Record<string, Chain> | null> => {
  const response = await fetch(`${ADAMIK_API_URL}/chains`, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "GET",
  });

  if (response.status === 200) {
    const data: GetChainsResponse = await response.json();
    return data?.chains;
  }

  return null;
};
