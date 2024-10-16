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

  // FIXME DEBUG TBR
  const truc = await response.json();
  console.log("XXX - chains - response:", truc);

  if (response.status === 200) {
    const data: GetChainsResponse = truc;
    return data?.chains;
  }

  return null;
};
