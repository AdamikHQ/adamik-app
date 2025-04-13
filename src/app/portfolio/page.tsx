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
import { Progress } from "~/components/ui/progress";

export default function Portfolio() {
  const {
    addresses: walletAddresses,
    setWalletMenuOpen: setWalletMenuOpen,
    isShowroom,
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

  const { data: addressesData, isLoading: isAddressesLoading } =
    useAccountStateBatch(displayAddresses);
  const { data: mobulaBlockchainDetails } = useMobulaBlockchains();
  const [openTransaction, setOpenTransaction] = useState(false);
  const [hideLowBalance, setHideLowBalance] = useState(true);
  const [stepper, setStepper] = useState(0);

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

  // Add loading state management with toast
  useEffect(() => {
    let loadingToast: ReturnType<typeof toast> | undefined;

    if (isLoading) {
      loadingToast = toast({
        description: (
          <div className="flex flex-col gap-2">
            <div className="font-medium">Loading portfolio data...</div>
            <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
              {isAddressesLoading && <div>• Fetching addresses data</div>}
              {isAssetDetailsLoading && <div>• Loading asset details</div>}
              {isSupportedChainsLoading && (
                <div>• Loading chain information</div>
              )}
              {isMobulaMarketDataLoading && <div>• Fetching market data</div>}
            </div>
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
  }, [
    isLoading,
    isAddressesLoading,
    isAssetDetailsLoading,
    isSupportedChainsLoading,
    isMobulaMarketDataLoading,
    toast,
  ]);

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

  const refreshPositions = useCallback(async () => {
    console.log("🔄 Starting refresh for addresses:", displayAddresses);

    let completedQueries = 0;
    const totalQueries = displayAddresses.length;
    let isCancelled = false;

    // Create initial progress toast
    const progressToast = toast({
      description: (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span>Refreshing portfolio...</span>
            <span className="text-sm text-muted-foreground">
              {completedQueries}/{totalQueries} addresses
            </span>
          </div>
          <Progress
            value={(completedQueries / totalQueries) * 100}
            className="h-2"
          />
        </div>
      ),
      duration: Infinity,
    });

    try {
      // First, cancel any existing queries to prevent conflicts
      await queryClient.cancelQueries({ queryKey: ["accountState"] });
      await queryClient.cancelQueries({ queryKey: ["mobula"] });

      // Clear cache for all addresses
      displayAddresses.forEach(({ chainId, address }) => {
        console.log(`🗑️ Clearing cache for ${chainId}:${address}`);
        clearAccountStateCache({
          chainId,
          address,
        });
      });

      // Invalidate queries but don't refetch yet
      await queryClient.invalidateQueries({
        queryKey: ["accountState"],
        refetchType: "none",
      });

      await queryClient.invalidateQueries({
        queryKey: ["mobula"],
        refetchType: "none",
      });

      // Process queries in batches to avoid overwhelming the system
      const batchSize = 3; // Process 3 queries at a time
      const batches = [];

      for (let i = 0; i < displayAddresses.length; i += batchSize) {
        const batch = displayAddresses.slice(i, i + batchSize);
        batches.push(batch);
      }

      for (const batch of batches) {
        if (isCancelled) break;

        await Promise.all(
          batch.map(async ({ chainId, address }) => {
            if (isCancelled) return;

            try {
              await queryClient.fetchQuery({
                queryKey: ["accountState", chainId, address],
                queryFn: () => accountState(chainId, address),
                staleTime: 0,
              });

              completedQueries++;

              // Update progress toast
              if (!isCancelled) {
                const newDescription = (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span>Refreshing portfolio...</span>
                      <span className="text-sm text-muted-foreground">
                        {completedQueries}/{totalQueries} addresses
                      </span>
                    </div>
                    <Progress
                      value={(completedQueries / totalQueries) * 100}
                      className="h-2"
                    />
                  </div>
                );

                progressToast.update({
                  id: progressToast.id,
                  description: newDescription,
                });
              }
            } catch (error) {
              if (
                error instanceof Error &&
                error.message.includes("CancelledError")
              ) {
                isCancelled = true;
                return;
              }
              console.error(`Error refreshing ${chainId}:${address}:`, error);
            }
          })
        );
      }

      if (!isCancelled) {
        progressToast.dismiss();
        toast({
          description: "Portfolio updated successfully",
          duration: 2000,
        });
      }
    } catch (error) {
      if (!isCancelled) {
        progressToast.dismiss();
        toast({
          description: "Failed to update some portfolio data",
          variant: "destructive",
          duration: 3000,
        });
        console.error("Error refreshing positions:", error);
      }
    }

    return () => {
      isCancelled = true;
      progressToast.dismiss();
    };
  }, [displayAddresses, queryClient, toast]);

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
          setHideLowBalance={setHideLowBalance}
          refreshPositions={refreshPositions}
        />

        <AssetsBreakdown
          isLoading={isLoading}
          assets={assets}
          totalBalance={totalBalance}
          hideLowBalance={hideLowBalance}
          setHideLowBalance={setHideLowBalance}
          stakingPositions={stakingPositions}
        />
      </div>

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
