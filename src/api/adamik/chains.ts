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
    },
    method: "GET",
  });

  const data: GetChainsResponse = await response.json();

  if (response.status === 200) {
    return data?.chains;
  } else {
    console.error("chains - backend error:", JSON.stringify(data));
    return null;
  }
};
