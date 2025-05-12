"use client";

import { Info } from "lucide-react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ShowroomBanner } from "~/components/layout/ShowroomBanner";
import { TransferTransactionForm } from "~/components/transactions/TransferTransactionForm";
import { Modal } from "~/components/ui/modal";
import { Tooltip } from "~/components/ui/tooltip";
import { useToast } from "~/components/ui/use-toast";
import { WalletSelection } from "~/components/wallets/WalletSelection";
import { WalletSigner } from "~/components/wallets/WalletSigner";
import {
  clearAccountStateCache,
  isInAccountStateBatchCache,
  useAccountStateBatch,
} from "~/hooks/useAccountStateBatch";
import { useChains } from "~/hooks/useChains";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { useWallet } from "~/hooks/useWallet";
import { showroomAddresses } from "../../utils/showroomAddresses";
import {
  aggregateStakingBalances,
  getAddressStakingPositions,
} from "../stake/helpers";
import { AssetsBalances } from "./AssetsBalances";
import { AssetsBreakdown } from "./AssetsBreakdown";
import { AssetsList } from "./AssetsList";
import { ConnectWallet } from "./ConnectWallet";
import {
  calculateAssets,
  filterAndSortAssets,
  getTickers,
  getTokenContractAddresses,
  getTokenTickers,
} from "./helpers";
import { WalletConnect } from "~/components";
import { useQueryClient } from "@tanstack/react-query";
import { accountState } from "~/api/adamik/accountState";
import { CustomProgress } from "~/components/ui/custom-progress";
import { PortfolioLoadingPlaceholder } from "./PortfolioLoadingPlaceholder";
import { Account } from "~/components/wallets/types";

export default function Portfolio() {
  const {
    addresses: walletAddresses,
    setWalletMenuOpen: setWalletMenuOpen,
    isShowroom,
    recentlyAddedAddresses,
    clearRecentlyAddedAddresses,
  } = useWallet();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const displayAddresses = isShowroom ? showroomAddresses : walletAddresses;
  const addressesChainIds = displayAddresses.reduce<string[]>(
    (acc, { chainId }) => {
      if (acc.includes(chainId)) return acc;
      return [...acc, chainId];
    },
    []
  );

  const { isLoading: isSupportedChainsLoading, data: supportedChains } =
    useChains();
  const chainsDetails =
    supportedChains &&
    Object.values(supportedChains).filter((chain) =>
      addressesChainIds.includes(chain.id)
    );

  const {
    data: addressesData,
    isLoading: isAddressesLoading,
    progress: addressesLoadingProgress,
  } = useAccountStateBatch(displayAddresses);

  const { data: mobulaBlockchainDetails } = useMobulaBlockchains();
  const [openTransaction, setOpenTransaction] = useState(false);
  const [hideLowBalance, setHideLowBalance] = useState(false);
  const [stepper, setStepper] = useState(0);

  // Use the hideLowBalances setting from localStorage
  useEffect(() => {
    try {
      const clientState = localStorage.getItem("AdamikClientState") || "{}";
      const parsedState = JSON.parse(clientState);
      if (typeof parsedState.hideLowBalances === "boolean") {
        setHideLowBalance(parsedState.hideLowBalances);
      }
    } catch (error) {
      console.error("Error reading hideLowBalances setting:", error);
    }
  }, []);

  const mainChainTickersIds = getTickers(chainsDetails || []);
  const tokenTickers = getTokenTickers(addressesData || []);
  const tokenContractAddresses = getTokenContractAddresses(addressesData || []);

  const { data: mobulaMarketData, isLoading: isAssetDetailsLoading } =
    useMobulaMarketMultiData(
      [...mainChainTickersIds, ...tokenTickers],
      !isSupportedChainsLoading && !isAddressesLoading,
      "symbols"
    );

  const {
    data: mobulaMarketDataContractAddresses,
    isLoading: isMobulaMarketDataLoading,
  } = useMobulaMarketMultiData(
    tokenContractAddresses,
    !isSupportedChainsLoading && !isAddressesLoading,
    "assets"
  );

  const stakingBalances = useMemo(
    () =>
      aggregateStakingBalances(
        addressesData,
        chainsDetails || [],
        mobulaMarketData
      ),
    [chainsDetails, addressesData, mobulaMarketData]
  );

  // Fetch staking positions
  const stakingPositions = useMemo(
    () =>
      Object.values(
        getAddressStakingPositions(
          addressesData,
          chainsDetails || [],
          mobulaMarketData,
          []
        )
      ),
    [addressesData, chainsDetails, mobulaMarketData]
  );

  const isLoading =
    isAddressesLoading ||
    isAssetDetailsLoading ||
    isSupportedChainsLoading ||
    isMobulaMarketDataLoading;

  // Add some console logs to help debug loading state
  useEffect(() => {
    console.log("Loading states:", {
      isAddressesLoading,
      isAssetDetailsLoading,
      isSupportedChainsLoading,
      isMobulaMarketDataLoading,
      overall: isLoading,
    });
  }, [
    isAddressesLoading,
    isAssetDetailsLoading,
    isSupportedChainsLoading,
    isMobulaMarketDataLoading,
    isLoading,
  ]);

  // Add a force refresh function for when the UI gets stuck
  const forceRefresh = useCallback(() => {
    console.log("Force refreshing portfolio data...");
    // Force refresh Mobula data which often gets stuck
    queryClient.invalidateQueries({ queryKey: ["mobula"] });

    // Force refresh chain data
    queryClient.invalidateQueries({ queryKey: ["chains"] });

    // Force refresh all account state data
    displayAddresses.forEach(({ chainId, address }) => {
      clearAccountStateCache({
        chainId,
        address,
      });
      queryClient.invalidateQueries({
        queryKey: ["accountState", chainId, address],
        refetchType: "active",
      });
    });

    // Show a toast to inform the user
    toast({
      description: "Forcing data refresh...",
      duration: 3000,
    });

    // If all else fails, try a page reload after 15 seconds if still loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        toast({
          description: "Still loading, trying to reload page...",
          duration: 3000,
        });
        // Give one more second before reload
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, [displayAddresses, queryClient, toast, isLoading]);

  // Add long timeout to automatically recover from stuck loading states
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isLoading) {
      // If loading takes more than 30 seconds, trigger force refresh
      timeoutId = setTimeout(() => {
        console.log("Loading timeout exceeded, triggering force refresh");
        forceRefresh();
      }, 30000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, forceRefresh]);

  // Fix the loading toast useEffect to have consistent dependencies
  useEffect(() => {
    let loadingToast: ReturnType<typeof toast> | undefined;

    // Now that wallet connections are batched, we can safely show data loading toast
    if (isLoading) {
      loadingToast = toast({
        description: (
          <div className="flex flex-col gap-2 w-full min-w-[300px]">
            <div className="flex items-center justify-between w-full">
              <span>Loading portfolio data...</span>
              <span className="text-sm text-muted-foreground">
                {addressesLoadingProgress}%
              </span>
            </div>
            <CustomProgress value={addressesLoadingProgress} />
          </div>
        ),
        duration: Infinity,
      });
    } else if (loadingToast) {
      // Dismiss the loading toast
      loadingToast.dismiss();

      // Show completion toast
      toast({
        description: "Portfolio loaded successfully",
        duration: 2000,
      });
    }

    return () => {
      if (loadingToast) {
        loadingToast.dismiss();
      }
    };
  }, [isLoading, isAddressesLoading, toast, addressesLoadingProgress]);

  const assets = useMemo(() => {
    return filterAndSortAssets(
      calculateAssets(
        displayAddresses,
        addressesData,
        chainsDetails || [],
        {
          ...mobulaMarketData,
          ...mobulaMarketDataContractAddresses,
        },
        mobulaBlockchainDetails
      ),
      hideLowBalance
    );
  }, [
    mobulaBlockchainDetails,
    chainsDetails,
    addressesData,
    displayAddresses,
    mobulaMarketData,
    mobulaMarketDataContractAddresses,
    hideLowBalance,
  ]);

  const availableBalance = useMemo(
    () =>
      assets.reduce((acc, asset) => {
        return acc + (asset?.balanceUSD || 0);
      }, 0),
    [assets]
  );

  const totalBalance =
    availableBalance +
    stakingBalances.claimableRewards +
    stakingBalances.stakedBalance +
    stakingBalances.unstakingBalance;

  // Update the refreshPositions function to be more reliable
  const refreshPositions = useCallback(
    async (specificAddresses?: Account[]) => {
      // If specificAddresses is provided, use them; otherwise use all displayAddresses
      const addressesToRefresh = specificAddresses || displayAddresses;

      // Add check for empty addresses
      if (!addressesToRefresh || addressesToRefresh.length === 0) {
        console.log("No addresses to refresh");
        toast({
          description: "No wallet addresses to refresh",
          duration: 2000,
        });
        return;
      }

      console.log("🔄 Starting refresh for addresses:", addressesToRefresh);

      let completedQueries = 0;
      const totalQueries = addressesToRefresh.length;
      let isCancelled = false;

      // Don't show a toast if we're only refreshing 1 address (likely from a new chain add)
      const shouldShowToast =
        addressesToRefresh.length > 1 || !specificAddresses;
      let progressToast: ReturnType<typeof toast> | undefined;

      if (shouldShowToast) {
        // Create initial progress toast
        progressToast = toast({
          description: (
            <div className="flex flex-col gap-2 w-full min-w-[300px]">
              <div className="flex items-center justify-between w-full">
                <span>Refreshing portfolio...</span>
                <span className="text-sm text-muted-foreground">
                  {completedQueries}/{totalQueries} addresses
                </span>
              </div>
              <CustomProgress value={(completedQueries / totalQueries) * 100} />
            </div>
          ),
          duration: Infinity,
        });
      }

      try {
        // First invalidate chain data to ensure we have the latest chain info
        try {
          queryClient.invalidateQueries({ queryKey: ["chains"] });
        } catch (error) {
          console.log("Error invalidating chains:", error);
        }

        // First, let's update the cancel queries logic in refreshPositions to be more robust
        // Find the cancelQueries block and replace it with this:
        try {
          // Instead of cancelling queries with complex predicates, we'll use a safer approach
          // Just invalidate the queries without cancelling them
          for (const { chainId, address } of addressesToRefresh) {
            // Simply mark queries as stale - no need to cancel them
            queryClient.invalidateQueries({
              queryKey: ["accountState", chainId, address],
              refetchType: "none",
            });
          }

          // For mobula data, also just invalidate without cancelling
          if (!specificAddresses) {
            queryClient.invalidateQueries({
              queryKey: ["mobula"],
              refetchType: "none",
            });
          }
        } catch (error) {
          console.log("Query invalidation error:", error);
          // Continue execution regardless of errors
        }

        // Clear cache for targeted addresses
        addressesToRefresh.forEach(({ chainId, address }) => {
          console.log(`🗑️ Clearing cache for ${chainId}:${address}`);
          clearAccountStateCache({
            chainId,
            address,
          });
        });

        // Invalidate queries but don't refetch yet
        try {
          // Build an array of query keys to invalidate
          const queryKeysToInvalidate = addressesToRefresh.map(
            ({ chainId, address }) => ["accountState", chainId, address]
          );

          // Invalidate each query key
          for (const queryKey of queryKeysToInvalidate) {
            await queryClient.invalidateQueries({
              queryKey,
              refetchType: "none",
            });
          }

          // Only invalidate mobula if we're doing a full refresh
          if (!specificAddresses) {
            await queryClient.invalidateQueries({
              queryKey: ["mobula"],
              refetchType: "none",
            });
          }
        } catch (invalidateError) {
          console.log("Query invalidation:", invalidateError);
          // Continue execution - invalidation errors shouldn't stop the refresh
        }

        // Process queries in batches to avoid overwhelming the system
        const batchSize = 3; // Process 3 queries at a time
        const batches = [];

        for (let i = 0; i < addressesToRefresh.length; i += batchSize) {
          const batch = addressesToRefresh.slice(i, i + batchSize);
          batches.push(batch);
        }

        for (const batch of batches) {
          if (isCancelled) break;

          // Use allSettled instead of all to prevent one failure from stopping everything
          const results = await Promise.allSettled(
            batch.map(async ({ chainId, address }) => {
              if (isCancelled) return;

              try {
                await queryClient.fetchQuery({
                  queryKey: ["accountState", chainId, address],
                  queryFn: () => accountState(chainId, address),
                  staleTime: 0,
                  retry: 1, // Limit retries to avoid endless attempts
                });

                return { success: true, chainId, address };
              } catch (error) {
                if (
                  error instanceof Error &&
                  (error.message.includes("CancelledError") ||
                    error.name === "CancelledError")
                ) {
                  isCancelled = true;
                  return { success: false, cancelled: true, chainId, address };
                }
                console.error(`Error refreshing ${chainId}:${address}:`, error);
                return { success: false, error, chainId, address };
              }
            })
          );

          // Only count successful queries
          const successfulQueries = results.filter(
            (result) => result.status === "fulfilled" && result.value?.success
          ).length;

          completedQueries += successfulQueries;

          // Update progress toast if it exists
          if (!isCancelled && progressToast) {
            const newDescription = (
              <div className="flex flex-col gap-2 w-full min-w-[300px]">
                <div className="flex items-center justify-between w-full">
                  <span>Refreshing portfolio...</span>
                  <span className="text-sm text-muted-foreground">
                    {completedQueries}/{totalQueries} addresses
                  </span>
                </div>
                <CustomProgress
                  value={(completedQueries / totalQueries) * 100}
                />
              </div>
            );

            progressToast.update({
              id: progressToast.id,
              description: newDescription,
            });
          }
        }

        if (!isCancelled && progressToast) {
          progressToast.dismiss();

          // Only show completion toast if we were showing progress
          if (shouldShowToast) {
            toast({
              description: "Portfolio updated successfully",
              duration: 2000,
            });
          }
        }

        // Clear the recently added addresses since we've refreshed them
        if (specificAddresses && specificAddresses === recentlyAddedAddresses) {
          clearRecentlyAddedAddresses();
        }
      } catch (error) {
        // Check if it's a cancellation error, which we can safely ignore
        const isCancellationError =
          error instanceof Error &&
          (error.message.includes("CancelledError") ||
            error.name === "CancelledError");

        if (!isCancelled && !isCancellationError && progressToast) {
          progressToast.dismiss();

          // Only show error toast if we were showing progress
          if (shouldShowToast) {
            toast({
              description: "Failed to update some portfolio data",
              variant: "destructive",
              duration: 3000,
            });
          }
          console.error("Error refreshing positions:", error);
        } else if (progressToast) {
          // For cancellation errors, just clean up the toast
          progressToast.dismiss();
          console.log("Refresh operation was cancelled");
        }
      }

      return () => {
        isCancelled = true;
        if (progressToast) {
          progressToast.dismiss();
        }
      };
    },
    [
      displayAddresses,
      queryClient,
      toast,
      recentlyAddedAddresses,
      clearRecentlyAddedAddresses,
    ]
  );

  // Add a useEffect to automatically refresh newly added addresses
  useEffect(() => {
    // Avoid refreshing if there are no new addresses
    if (!recentlyAddedAddresses || recentlyAddedAddresses.length === 0) {
      return;
    }

    console.log("New addresses detected, refreshing:", recentlyAddedAddresses);

    // Debounce refresh for multiple chains added in quick succession
    const timeoutId = setTimeout(() => {
      try {
        // Wrap in try/catch to prevent errors from bubbling up to React
        refreshPositions(recentlyAddedAddresses).catch((error) => {
          // Safely handle any errors without crashing
          console.log("Caught error refreshing new addresses:", error);
        });
      } catch (error) {
        console.log("Error setting up refresh for new addresses:", error);
      }
    }, 100); // Small delay to group multiple chain additions

    return () => {
      clearTimeout(timeoutId);
    };
  }, [recentlyAddedAddresses, refreshPositions]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Portfolio</h1>
          <Tooltip text="View the API documentation for retrieving balances">
            <a
              href="https://docs.adamik.io/api-reference/account/get-account-state-balances"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
            </a>
          </Tooltip>
        </div>
        <WalletConnect />
      </div>

      {isShowroom ? <ShowroomBanner /> : null}

      {isLoading ? (
        <PortfolioLoadingPlaceholder
          addresses={displayAddresses}
          chains={supportedChains}
        />
      ) : (
        <>
          <AssetsBalances
            isLoading={isLoading}
            totalBalance={totalBalance}
            availableBalance={availableBalance}
            stakingBalances={stakingBalances}
          />

          <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-3">
            <AssetsList
              isLoading={isLoading}
              assets={assets}
              openTransaction={openTransaction}
              setOpenTransaction={setOpenTransaction}
              hideLowBalance={hideLowBalance}
              refreshPositions={refreshPositions}
            />

            <AssetsBreakdown
              isLoading={isLoading}
              assets={assets}
              totalBalance={totalBalance}
              hideLowBalance={hideLowBalance}
              stakingPositions={stakingPositions}
            />
          </div>
        </>
      )}

      <Modal
        open={openTransaction}
        setOpen={setOpenTransaction}
        modalContent={
          // Probably need to rework
          stepper === 0 ? (
            <TransferTransactionForm
              // FIXME non-filtered assets should be used here
              assets={assets}
              onNextStep={() => {
                setStepper(1);
              }}
            />
          ) : (
            <>
              {walletAddresses && walletAddresses.length > 0 ? (
                <WalletSigner
                  onNextStep={() => {
                    setOpenTransaction(false);
                    setTimeout(() => {
                      setStepper(0);
                    }, 200);
                  }}
                />
              ) : (
                <ConnectWallet
                  onNextStep={() => {
                    setOpenTransaction(false);
                    setWalletMenuOpen(true);
                    setTimeout(() => {
                      setStepper(0);
                    }, 200);
                  }}
                />
              )}
            </>
          )
        }
      />
    </main>
  );
}
