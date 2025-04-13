"use client";

import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingModal } from "~/components/layout/LoadingModal";
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

export default function Stake() {
  const { addresses, isShowroom, setWalletMenuOpen } = useWallet();
  const { setChainId, setTransaction } = useTransaction();
  const [currentTransactionFlow, setCurrentTransactionFlow] = useState<
    TransactionMode | undefined
  >(undefined);
  const [stepper, setStepper] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const aggregatedBalances = aggregateStakingBalances(
    addressesData,
    chainsDetails || [],
    mobulaMarketData
  );

  const stakingPositions = getAddressStakingPositions(
    addressesData,
    chainsDetails || [],
    mobulaMarketData,
    validatorsData
  );

  const validators = createValidatorList(
    validatorsData,
    chainsDetails || [],
    mobulaMarketData
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

  const refreshPositions = () => {
    console.log("🔄 Starting refresh for staking positions");

    let completedQueries = 0;
    const stakableAssets = assets.filter((asset) => asset.isStakable);
    const totalQueries = stakableAssets.length;

    // Create initial progress toast
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

    // Clear cache for all stakable assets
    stakableAssets.forEach(({ chainId, address }) => {
      console.log(`🗑️ Clearing cache for ${chainId}:${address}`);
      clearAccountStateCache({
        chainId,
        address,
      });
    });

    // Force immediate refetch of all queries
    console.log("♻️ Invalidating all account state queries");
    queryClient.invalidateQueries({
      queryKey: ["accountState"],
      refetchType: "all",
    });

    console.log("♻️ Invalidating all validator queries");
    queryClient.invalidateQueries({
      queryKey: ["validators"],
      refetchType: "all",
    });

    // Create promises for each account state query
    const promises = stakableAssets.map(({ chainId, address }) =>
      queryClient
        .fetchQuery({
          queryKey: ["accountState", chainId, address],
          queryFn: () => accountState(chainId, address),
        })
        .then(() => {
          completedQueries++;
          // Update progress toast with new description
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
        })
    );

    // Wait for all queries to complete
    Promise.all(promises)
      .then(() => {
        progressToast.dismiss();
        // Show success toast
        toast({
          description: "Staking data updated successfully",
          duration: 2000,
        });
      })
      .catch((error) => {
        progressToast.dismiss();
        // Show error toast
        toast({
          description: "Failed to update some staking data",
          variant: "destructive",
          duration: 3000,
        });
        console.error("Error refreshing staking positions:", error);
      });
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      {isLoading && !isInAccountStateBatchCache(displayAddresses) ? (
        <LoadingModal />
      ) : null}
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
          setOpen={(value) => !value && setCurrentTransactionFlow(undefined)}
          modalContent={
            stepper === 0 ? (
              <StakingTransactionForm
                mode={currentTransactionFlow}
                assets={assets}
                stakingPositions={stakingPositions}
                validators={validators}
                onNextStep={() => {
                  setStepper(1);
                }}
              />
            ) : (
              <>
                {addresses && addresses.length > 0 ? (
                  <WalletSigner
                    onNextStep={() => {
                      setCurrentTransactionFlow(undefined);
                      setTimeout(() => {
                        setStepper(0);
                      }, 200);
                    }}
                  />
                ) : (
                  <ConnectWallet
                    onNextStep={() => {
                      setCurrentTransactionFlow(undefined);
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
      )}
    </main>
  );
}
