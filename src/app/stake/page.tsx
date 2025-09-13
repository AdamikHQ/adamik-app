"use client";

import { Info } from "lucide-react";
import { useMemo, useState, useCallback, useEffect } from "react";
import { ShowroomBanner } from "~/components/layout/ShowroomBanner";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { Tooltip } from "~/components/ui/tooltip";
import { useToast } from "~/components/ui/use-toast";
import { Progress } from "~/components/ui/progress";
import {
  clearAccountStateCache,
  isInAccountStateBatchCache,
  useAccountStateBatch,
} from "~/hooks/useAccountStateBatch";
import { accountState } from "~/api/adamik/accountState";
import { useChains } from "~/hooks/useChains";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { useTransaction } from "~/hooks/useTransaction";
import { useValidatorsBatch } from "~/hooks/useValidatorsBatch";
import { useWallet } from "~/hooks/useWallet";
import { TransactionMode } from "~/utils/types";
import { showroomAddresses } from "../../utils/showroomAddresses";
import { ConnectWallet } from "../portfolio/ConnectWallet";
import {
  calculateAssets,
  filterAndSortAssets,
  getTickers,
} from "../portfolio/helpers";
import { WalletSelection } from "~/components/wallets/WalletSelection";
import { StakingBalances } from "./StakingBalances";
import { StakingTransactionForm } from "~/components/transactions/StakingTransactionForm";
import { WalletSigner } from "~/components/wallets/WalletSigner";
import {
  aggregateStakingBalances,
  createValidatorList,
  getAddressStakingPositions,
} from "./helpers";
import { StakingPositionsList } from "./StakingPositionsList";
import { isStakingSupported } from "~/utils/helper";
import { WalletConnect } from "~/components";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function Stake() {
  const { addresses, isShowroom, setWalletMenuOpen } = useWallet();
  const { setChainId, setTransaction } = useTransaction();
  const [currentTransactionFlow, setCurrentTransactionFlow] = useState<
    TransactionMode | undefined
  >(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoadingToastVisible, setIsLoadingToastVisible] = useState(false);

  const displayAddresses = isShowroom ? showroomAddresses : addresses;
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

  const { data: addressesData, isLoading: isAddressStateLoading } =
    useAccountStateBatch(displayAddresses);
  const { data: mobulaBlockchainDetails } = useMobulaBlockchains();

  const mainChainTickersIds = getTickers(chainsDetails || []);
  const { data: mobulaMarketData } = useMobulaMarketMultiData(
    [...mainChainTickersIds],
    !isSupportedChainsLoading,
    "symbols"
  );

  const stakingSupportedChainIds = useMemo(
    () =>
      chainsDetails
        ?.filter((chain) => isStakingSupported(chain))
        .map((chain) => chain.id) ?? [],
    [chainsDetails]
  );

  const { data: validatorsData, isLoading: validatorLoading } =
    useValidatorsBatch(stakingSupportedChainIds);

  const isLoading =
    validatorLoading || isSupportedChainsLoading || isAddressStateLoading;

  useEffect(() => {
    const shouldShowLoadingToast =
      isLoading &&
      !isInAccountStateBatchCache(displayAddresses) &&
      (!addressesData || !validatorsData || !chainsDetails);

    if (shouldShowLoadingToast && !isLoadingToastVisible) {
      toast({
        description: (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading staking data...</span>
          </div>
        ),
        duration: 30000,
      });

      setIsLoadingToastVisible(true);
    } else if (!isLoading && isLoadingToastVisible) {
      toast({
        description: "Staking data loaded successfully",
        duration: 2000,
      });

      setIsLoadingToastVisible(false);
    }
  }, [
    isLoading,
    toast,
    isLoadingToastVisible,
    addressesData,
    validatorsData,
    chainsDetails,
    displayAddresses,
  ]);

  const aggregatedBalances = useMemo(
    () =>
      aggregateStakingBalances(
        addressesData,
        chainsDetails || [],
        mobulaMarketData
      ),
    [addressesData, chainsDetails, mobulaMarketData]
  );

  const stakingPositions = useMemo(
    () =>
      getAddressStakingPositions(
        addressesData,
        chainsDetails || [],
        mobulaMarketData,
        validatorsData
      ),
    [addressesData, chainsDetails, mobulaMarketData, validatorsData]
  );

  const validators = useMemo(
    () =>
      createValidatorList(
        validatorsData,
        chainsDetails || [],
        mobulaMarketData
      ),
    [validatorsData, chainsDetails, mobulaMarketData]
  );

  const assets = useMemo(
    () =>
      filterAndSortAssets(
        calculateAssets(
          displayAddresses,
          addressesData,
          chainsDetails || [],
          mobulaMarketData,
          mobulaBlockchainDetails
        ),
        false
      ).filter((asset) => asset.isStakable),
    [
      displayAddresses,
      addressesData,
      mobulaBlockchainDetails,
      chainsDetails,
      mobulaMarketData,
    ]
  );

  const refreshPositions = useCallback(async () => {
    console.log("🔄 Starting refresh for staking positions");

    let completedQueries = 0;
    const stakableAssets = assets.filter((asset) => asset.isStakable);
    const totalQueries = stakableAssets.length;
    let isCancelled = false;

    const progressToast = toast({
      description: (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span>Refreshing staking data...</span>
            <span className="text-sm text-muted-foreground">
              {completedQueries}/{totalQueries} chains
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
      try {
        await queryClient.cancelQueries({ queryKey: ["accountState"] });
        await queryClient.cancelQueries({ queryKey: ["validators"] });
      } catch (cancelError) {
        console.log("Query cancellation:", cancelError);
      }

      stakableAssets.forEach(({ chainId, address }) => {
        console.log(`🗑️ Clearing cache for ${chainId}:${address}`);
        clearAccountStateCache({
          chainId,
          address,
        });
      });
      
      // Force React Query to refetch the cleared queries
      await queryClient.refetchQueries({
        queryKey: ["accountState"],
        type: "active",
      });

      try {
        await queryClient.invalidateQueries({
          queryKey: ["accountState"],
          refetchType: "none",
        });

        await queryClient.invalidateQueries({
          queryKey: ["validators"],
          refetchType: "none",
        });
      } catch (invalidateError) {
        console.log("Query invalidation:", invalidateError);
      }

      const batchSize = 3;
      const batches = [];

      for (let i = 0; i < stakableAssets.length; i += batchSize) {
        const batch = stakableAssets.slice(i, i + batchSize);
        batches.push(batch);
      }

      for (const batch of batches) {
        if (isCancelled) break;

        const results = await Promise.allSettled(
          batch.map(async ({ chainId, address }) => {
            if (isCancelled) return;

            try {
              await queryClient.fetchQuery({
                queryKey: ["accountState", chainId, address],
                queryFn: () => accountState(chainId, address),
                staleTime: 0,
                retry: 1,
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

        const successfulQueries = results.filter(
          (result) => result.status === "fulfilled" && result.value?.success
        ).length;

        completedQueries += successfulQueries;

        if (!isCancelled) {
          const newDescription = (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>Refreshing staking data...</span>
                <span className="text-sm text-muted-foreground">
                  {completedQueries}/{totalQueries} chains
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
      }

      if (!isCancelled) {
        progressToast.dismiss();
        toast({
          description: "Staking data updated successfully",
          duration: 2000,
        });
      }
    } catch (error) {
      const isCancellationError =
        error instanceof Error &&
        (error.message.includes("CancelledError") ||
          error.name === "CancelledError");

      if (!isCancelled && !isCancellationError) {
        progressToast.dismiss();
        toast({
          description: "Failed to update some staking data",
          variant: "destructive",
          duration: 3000,
        });
        console.error("Error refreshing staking positions:", error);
      } else {
        progressToast.dismiss();
        console.log("Refresh operation was cancelled");
      }
    }

    return () => {
      isCancelled = true;
      progressToast.dismiss();
    };
  }, [assets, queryClient, toast]);

  const handleModalClose = useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (typeof value === "boolean" && !value) {
        setCurrentTransactionFlow(undefined);
      }
    },
    []
  );

  const handleTransactionComplete = useCallback(() => {
    setCurrentTransactionFlow(undefined);
  }, []);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Staking Portal</h1>
          <Tooltip text="View the API documentation for staking">
            <a
              href="https://docs.adamik.io/api-reference/chain/get-chain-validators"
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

      <StakingBalances aggregatedBalances={aggregatedBalances} />

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
        <Button
          className="col-span-2"
          onClick={() => {
            setChainId(undefined);
            setTransaction(undefined);
            setCurrentTransactionFlow(TransactionMode.STAKE);
          }}
        >
          Stake
        </Button>

        <Button
          onClick={() => {
            setChainId(undefined);
            setTransaction(undefined);
            setCurrentTransactionFlow(TransactionMode.UNSTAKE);
          }}
        >
          Unstake
        </Button>

        <Button
          onClick={() => {
            setChainId(undefined);
            setTransaction(undefined);
            setCurrentTransactionFlow(TransactionMode.CLAIM_REWARDS);
          }}
        >
          Claim
        </Button>
      </div>

      <StakingPositionsList
        stakingPositions={stakingPositions}
        refreshPositions={refreshPositions}
      />

      {!!currentTransactionFlow && (
        <Modal
          open={!!currentTransactionFlow}
          setOpen={handleModalClose}
          modalContent={
            <StakingTransactionForm
              mode={currentTransactionFlow}
              assets={assets}
              stakingPositions={stakingPositions}
              validators={validators}
              onNextStep={handleTransactionComplete}
            />
          }
        />
      )}
    </main>
  );
}
