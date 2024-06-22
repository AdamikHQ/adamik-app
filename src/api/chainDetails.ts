"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { Chain } from "~/utils/types";

export type getChainDetailsResponse = Chain;

export const getChainDetails = async (
  chainId: string
): Promise<getChainDetailsResponse | null> => {
  const response = await fetch(`${ADAMIK_API_URL}/chains/${chainId}`, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "GET",
  });

  if (response.status === 200) {
    return await response.json();
  }

  return null;
};
