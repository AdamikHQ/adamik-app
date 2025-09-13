import { useQueries, useQueryClient, useQuery } from "@tanstack/react-query";
import { accountState } from "~/api/adamik/accountState";
import { queryCache, queryClientGlobal } from "~/providers/QueryProvider";
import { useEffect, useMemo, useState, useCallback } from "react";
import { AccountState, Chain } from "~/utils/types";
import { getChains } from "~/api/adamik/chains";

type GetAddressStateParams = {
  chainId: string;
  address: string;
};

// Helper function to guess the chain family from chain ID when we don't have chain data
const guessChainFamily = (chainId: string): string => {
  // Common chain families - ordered by likely response speed
  const evmChains = [
    "ethereum",
    "polygon",
    "optimism",
    "arbitrum",
    "base",
    "avalanche",
    "zksync",
    "linea",
    "bnbchain",
  ];
  const cosmosChains = [
    "cosmoshub",
    "osmosis",
    "dydx",
    "stargaze",
    "juno",
    "kujira",
    "seinetwork",
    "neutron",
  ];
  const solanaFamily = ["solana"];
  const bitcoinFamily = ["bitcoin", "litecoin", "bitcoincash", "dogecoin"];
  const otherChains = [
    "ton",
    "aptos",
    "sui",
    "starknet",
    "tezos",
    "polkadot",
    "astar",
    "near",
  ];

  // Try to match the chain ID to a known family
  if (evmChains.includes(chainId.toLowerCase())) return "evm";
  if (cosmosChains.includes(chainId.toLowerCase())) return "cosmos";
  if (solanaFamily.includes(chainId.toLowerCase())) return "solana";
  if (bitcoinFamily.includes(chainId.toLowerCase())) return "bitcoin";
  if (otherChains.includes(chainId.toLowerCase())) return chainId.toLowerCase();

  // If we can't determine, default to 'unknown'
  return "unknown";
};

// Priority order of chain families based on typical response times
const FAMILY_PRIORITY = [
  "evm", // EVM chains typically respond quickly
  "solana", // Solana nodes are usually fast
  "cosmos", // Cosmos chains are reasonably fast
  "bitcoin", // Bitcoin can be slower due to UTXO model
  "unknown", // Unknown chains go last
];

export const isInAccountStateBatchCache = (
  addresses: GetAddressStateParams[]
) => {
  return addresses.every(({ chainId, address }) => {
    return queryCache.find({ queryKey: ["accountState", chainId, address] });
  });
};

// Batched implementation that processes addresses by chain family for better loading UX
export const useAccountStateBatch = (
  addressesParams: GetAddressStateParams[]
) => {
  const queryClient = useQueryClient();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadedAddresses, setLoadedAddresses] = useState<AccountState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get chain data to organize by family
  const { data: chainData } = useQuery({
    queryKey: ["chains"],
    queryFn: getChains,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  // Configure batch size - adjust this based on performance testing
  const BATCH_SIZE = 3;

  // Organize batches by chain family
  const batches = useMemo(() => {
    if (addressesParams.length === 0) return [];

    // Group addresses by chain family
    const addressesByFamily: Record<string, GetAddressStateParams[]> = {};

    // Process each address and group by family
    addressesParams.forEach((address) => {
      // Determine the chain family
      let family = "unknown";

      if (chainData && chainData[address.chainId]) {
        family = chainData[address.chainId].family;
      } else {
        family = guessChainFamily(address.chainId);
      }

      if (!addressesByFamily[family]) {
        addressesByFamily[family] = [];
      }
      addressesByFamily[family].push(address);
    });

    // Create batches prioritizing by family
    const result: GetAddressStateParams[][] = [];
    let currentBatch: GetAddressStateParams[] = [];

    // First, process families in priority order
    for (const family of FAMILY_PRIORITY) {
      if (!addressesByFamily[family] || addressesByFamily[family].length === 0)
        continue;

      const familyAddresses = [...addressesByFamily[family]];
      delete addressesByFamily[family]; // Remove processed family

      for (const address of familyAddresses) {
        // Add to current batch
        currentBatch.push(address);

        // If batch is full, add to results and start a new batch
        if (currentBatch.length >= BATCH_SIZE) {
          result.push([...currentBatch]);
          currentBatch = [];
        }
      }
    }

    // Process any remaining families that weren't in the priority list
    const remainingFamilies = Object.keys(addressesByFamily);
    for (const family of remainingFamilies) {
      const familyAddresses = addressesByFamily[family];

      for (const address of familyAddresses) {
        // Add to current batch
        currentBatch.push(address);

        // If batch is full, add to results and start a new batch
        if (currentBatch.length >= BATCH_SIZE) {
          result.push([...currentBatch]);
          currentBatch = [];
        }
      }
    }

    // Add any remaining addresses in the last batch
    if (currentBatch.length > 0) {
      result.push(currentBatch);
    }

    return result;
  }, [addressesParams, chainData]);

  // Log batching information for debugging
  useEffect(() => {
    if (batches.length > 0) {
      console.log(
        `Created ${batches.length} batches for ${addressesParams.length} addresses`
      );
      batches.forEach((batch, index) => {
        console.log(
          `Batch ${index + 1}: ${batch.map((a) => a.chainId).join(", ")}`
        );
      });
    }
  }, [batches, addressesParams.length]);

  useEffect(() => {
    if (addressesParams.length === 0) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    let completedAddresses = 0;
    const totalAddresses = addressesParams.length;
    const errors: unknown[] = [];
    const addressStates: AccountState[] = [];

    const processNextBatch = async (batchIndex: number) => {
      if (isCancelled || batchIndex >= batches.length) {
        if (!isCancelled) {
          setIsLoading(false);
          setError(errors);
        }
        return;
      }

      try {
        const currentBatch = batches[batchIndex];
        console.log(
          `Processing batch ${batchIndex + 1} with ${
            currentBatch.length
          } addresses`
        );

        const results = await Promise.all(
          currentBatch.map(async ({ chainId, address }) => {
            try {
              console.log(`Fetching data for ${chainId}:${address}`);
              // Skip cache check when refreshTrigger has changed
              // This forces a fresh fetch after refresh button is clicked
              const shouldSkipCache = refreshTrigger > 0;
              
              if (!shouldSkipCache) {
                // Check cache first
                const cachedData = queryCache.find({
                  queryKey: ["accountState", chainId, address],
                });

                if (cachedData?.state.data) {
                  console.log(`Using cached data for ${chainId}:${address}`);
                  return { data: cachedData.state.data, error: null };
                }
              } else {
                console.log(`Skipping cache for ${chainId}:${address} due to refresh`);
              }

              // Fetch fresh data with timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

              const data = await queryClient.fetchQuery({
                queryKey: ["accountState", chainId, address],
                queryFn: () => accountState(chainId, address),
                staleTime: 30000,
                gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
                retry: 1,
              });

              clearTimeout(timeoutId);
              return { data, error: null };
            } catch (err) {
              console.error(
                `Error fetching state for ${chainId}:${address}:`,
                err
              );
              return { data: null, error: err };
            }
          })
        );

        // Process results
        results.forEach((result) => {
          completedAddresses++;
          if (result.error) {
            errors.push(result.error);
          }
          if (
            result.data &&
            typeof result.data === "object" &&
            result.data !== null &&
            "chainId" in result.data &&
            "accountId" in result.data &&
            "balances" in result.data
          ) {
            addressStates.push(result.data as AccountState);
          }
        });

        if (!isCancelled) {
          // Update progress and loaded addresses
          const progress = Math.floor(
            (completedAddresses / totalAddresses) * 100
          );
          setLoadingProgress(progress);
          console.log(
            `Progress: ${progress}% (${completedAddresses}/${totalAddresses})`
          );
          setLoadedAddresses([...addressStates]);

          // Process next batch
          await processNextBatch(batchIndex + 1);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error processing batch:", err);
          errors.push(err);
          setError(errors);

          // Continue with next batch even if this one failed
          await processNextBatch(batchIndex + 1);
        }
      }
    };

    // Start processing batches
    setIsLoading(true);
    processNextBatch(0);

    return () => {
      isCancelled = true;
    };
  }, [batches, addressesParams, queryClient, refreshTrigger]);

  // Provide a way to trigger refresh
  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Return data in the same format as the original hook
  return {
    data: loadedAddresses,
    error,
    isLoading,
    progress: loadingProgress,
    refetch,
  };
};

export const clearAccountStateCache = ({
  chainId,
  address,
}: GetAddressStateParams) => {
  try {
    // First, try to cancel any in-flight queries gracefully
    queryClientGlobal.cancelQueries({
      queryKey: ["accountState", chainId, address],
    }).catch(() => {
      // Silently ignore cancellation errors
    });
    
    // Then invalidate to mark as stale (doesn't throw errors)
    queryClientGlobal.invalidateQueries({
      queryKey: ["accountState", chainId, address],
      refetchType: "none", // Don't trigger immediate refetch
    });
    
    // Finally, remove from cache (after cancellation is complete)
    // Wrap in setTimeout to ensure cancellation has finished
    setTimeout(() => {
      queryClientGlobal.removeQueries({
        queryKey: ["accountState", chainId, address],
      });
    }, 0);
  } catch (error) {
    // Silently handle any errors - the goal is to refresh data, 
    // not to crash the app
    console.debug("Cache clear operation:", error);
  }
};
