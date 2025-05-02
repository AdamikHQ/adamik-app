"use server";

import fetch from "node-fetch";
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

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
    },
    method: "GET",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ValidatorResponse;
};

export const getAllValidators = async (
  chainId: string | undefined
): Promise<ValidatorResponse> => {
  let validators: ValidatorResponse["validators"] = [];
  let nextPage: string | undefined = undefined;

  if (!chainId) {
    return {
      chainId: "",
      validators,
    };
  }

  do {
    const response = await getValidators(chainId, { nextPage });
    validators = response
      ? [...validators, ...response.validators]
      : validators;
    nextPage = (response && response.pagination?.nextPage) || undefined;
  } while (nextPage !== undefined);

  return {
    chainId,
    validators,
  };
};
