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
  pagination?: {
    nextPage: string | null;
  };
};

// TODO Better API error management, consistent for all endpoints
export const getValidators = async (
  chainId: string,
  options?: {
    nextPage?: string;
  }
): Promise<ValidatorResponse | null> => {
  const url = new URL(`${ADAMIK_API_URL}/${chainId}/validators`);

  if (options?.nextPage) {
    url.searchParams.set("nextPage", options.nextPage);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
    },
    method: "GET",
  });

  const result = await response.json();

  if (response.status !== 200) {
    console.error("validators - backend error:", JSON.stringify(result));
    return null;
  } else {
    return result;
  }
};

export const getAllValidators = async (
  chainId: string
): Promise<ValidatorResponse> => {
  let allValidators: ValidatorResponse["validators"] = [];
  let nextPage: string | undefined = undefined;

  do {
    const response = await getValidators(chainId, { nextPage });
    allValidators = response
      ? [...allValidators, ...response.validators]
      : allValidators;
    nextPage = (response && response.pagination?.nextPage) || undefined;
  } while (nextPage !== undefined);

  return {
    chainId,
    validators: allValidators,
  };
};
