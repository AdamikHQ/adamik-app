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

export const getValidators = async (
  chainId: string,
  offset?: number,
  limit?: number
): Promise<ValidatorResponse> => {
  const url = new URL(`${ADAMIK_API_URL}/chains/${chainId}/validators`);
  const body: {
    chainId: string;
    pagination: { offset?: number; limit?: number };
  } = {
    chainId,
    pagination: {},
  };
  if (offset !== undefined) {
    body.pagination.offset = offset;
  }
  if (limit) {
    body.pagination.limit = limit;
  }
  const response = await fetch(url, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(body),
  });

  if (response.status !== 200) {
    console.error("validators - backend error:", response.statusText);
  }

  return response.json();
};
