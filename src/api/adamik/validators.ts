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

  console.log(`[Validators] Fetching validators for chain ${chainId}`, {
    url: url.toString(),
    hasNextPage: !!options?.nextPage,
  });

  const response = await fetch(url, {
    headers: {
      Authorization: env.ADAMIK_API_KEY,
    },
    method: "GET",
  });

  const result = await response.json();

  if (response.status !== 200) {
    console.error("[Validators] Backend error:", {
      status: response.status,
      chainId,
      error: JSON.stringify(result),
    });
    return null;
  } else {
    console.log("[Validators] Success:", {
      chainId,
      validatorCount: result.validators.length,
      hasNextPage: !!result.pagination?.nextPage,
    });
    return result;
  }
};

export const getAllValidators = async (
  chainId: string
): Promise<ValidatorResponse> => {
  console.log(
    `[Validators] Starting to fetch all validators for chain ${chainId}`
  );
  let allValidators: ValidatorResponse["validators"] = [];
  let nextPage: string | undefined = undefined;
  let pageCount = 0;

  do {
    pageCount++;
    console.log(`[Validators] Fetching page ${pageCount}`, {
      chainId,
      nextPage,
      currentValidatorCount: allValidators.length,
    });

    const response = await getValidators(chainId, { nextPage });
    allValidators = response
      ? [...allValidators, ...response.validators]
      : allValidators;
    nextPage = (response && response.pagination?.nextPage) || undefined;
  } while (nextPage !== undefined);

  console.log("[Validators] Completed fetching all validators", {
    chainId,
    totalPages: pageCount,
    totalValidators: allValidators.length,
  });

  return {
    chainId,
    validators: allValidators,
  };
};
