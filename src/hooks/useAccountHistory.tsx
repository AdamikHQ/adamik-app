"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccountHistory } from "~/api/adamik/history";

// Hook to fetch account transaction history
export const useAccountHistory = (
  chainId: string | undefined,
  accountId: string | undefined,
  options?: { nextPage?: string } // Optional: Add pagination later if needed
) => {
  return useQuery({
    // Query key includes chain and account ID for uniqueness
    queryKey: ["accountHistory", chainId, accountId, options?.nextPage],
    // Query function calls the server action/API function
    queryFn: async () => getAccountHistory(chainId, accountId, options),
    // Only enable the query if chainId and accountId are provided
    enabled: !!chainId && !!accountId,
    // Optional: Configure staleTime, gcTime etc. if needed
    // staleTime: 1000 * 60 * 5, // 5 minutes
    // gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
