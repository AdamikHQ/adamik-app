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
    const errorText = await response.text();
    console.error(`❌ [Validators API] Failed to fetch validators for ${chainId}: ${response.status} ${response.statusText}`);
    console.error(`❌ [Validators API] Error details:`, errorText);
    return null;
  }

  const responseText = await response.text();
  let data: ValidatorResponse;
  
  try {
    data = JSON.parse(responseText) as ValidatorResponse;
  } catch (error) {
    console.error(`❌ [Validators API] Failed to parse response for ${chainId}:`, responseText);
    return { chainId, validators: [] };
  }
  
  
  // Ensure we always return a valid structure
  return {
    chainId: data.chainId || chainId,
    validators: data.validators || [],
    pagination: data.pagination
  };
};

export const getAllValidators = async (
  chainId: string
): Promise<ValidatorResponse> => {
  let allValidators: ValidatorResponse["validators"] = [];
  let nextPage: string | undefined = undefined;
  let pageCount = 0;
  // Increased limit for chains with many validators (e.g., Solana has 900+)
  // This is still a safety mechanism to prevent infinite loops
  const MAX_PAGES = 50;

  do {
    pageCount++;
    const response = await getValidators(chainId, { nextPage });
    
    if (response && response.validators) {
      allValidators = [...allValidators, ...response.validators];
      nextPage = response.pagination?.nextPage || undefined;
    } else {
      nextPage = undefined;
    }
    
    // Safety check to prevent infinite loops
    if (pageCount >= MAX_PAGES) {
      console.warn(`⚠️ [getAllValidators] Reached max pages (${MAX_PAGES}) for ${chainId}. Some validators may not be loaded.`);
      break;
    }
  } while (nextPage !== undefined);

  return {
    chainId,
    validators: allValidators,
  };
};
