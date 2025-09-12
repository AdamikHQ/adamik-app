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

  console.log(`🔍 [Validators API] Fetching validators for chain: ${chainId}`);
  console.log(`🔍 [Validators API] URL: ${url.toString()}`);

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
  
  console.log(`✅ [Validators API] Received ${data.validators?.length || 0} validators for ${chainId}`);
  if (chainId.includes('solana')) {
    console.log(`🔍 [Validators API] Solana raw response length:`, responseText.length);
    console.log(`🔍 [Validators API] Solana parsed validators:`, data.validators?.length);
    if (data.validators && data.validators.length > 0) {
      console.log(`🔍 [Validators API] First Solana validator:`, data.validators[0]);
    }
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
  console.log(`📊 [getAllValidators] Starting to fetch all validators for: ${chainId}`);
  let allValidators: ValidatorResponse["validators"] = [];
  let nextPage: string | undefined = undefined;
  let pageCount = 0;

  do {
    pageCount++;
    const response = await getValidators(chainId, { nextPage });
    
    if (response && response.validators) {
      allValidators = [...allValidators, ...response.validators];
      nextPage = response.pagination?.nextPage || undefined;
    } else {
      console.warn(`⚠️ [getAllValidators] No response or validators for ${chainId} on page ${pageCount}`);
      nextPage = undefined;
    }
    
    console.log(`📊 [getAllValidators] Page ${pageCount} - Total validators so far: ${allValidators.length}`);
  } while (nextPage !== undefined);

  console.log(`📊 [getAllValidators] Completed fetching ${allValidators.length} validators for ${chainId}`);
  
  return {
    chainId,
    validators: allValidators,
  };
};
