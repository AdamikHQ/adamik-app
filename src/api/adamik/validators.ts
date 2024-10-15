"use server";

import { env, ADAMIK_API_URL } from "~/env";

export type ValidatorResponse = {
  chainId: string;
  validators: {
    address: string;
    name: string;
    commission: string;
    stakedAmount: string;
  }[];
};

// TODO Better API error management, consistent for all endpoints
export const getValidators = async (
  chainId: string,
  offset?: number,
  limit?: number
): Promise<ValidatorResponse> => {
  const url = new URL(`${ADAMIK_API_URL}/chains/${chainId}/validators`);

  if (offset) {
    url.searchParams.set("offset", offset.toString());
  }
  if (limit) {
    url.searchParams.set("limit", limit.toString());
  }

  const response = await fetch(url, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
    },
    method: "GET",
  });

  const result = await response.json();

  if (response.status !== 200) {
    console.error("validators - backend error:", result);
  }

  return result;
};
