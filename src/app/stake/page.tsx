"use client";

import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingModal } from "~/components/layout/LoadingModal";
import { ShowroomBanner } from "~/components/layout/ShowroomBanner";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { Tooltip } from "~/components/ui/tooltip";
import { useToast } from "~/components/ui/use-toast";
import {
  clearAccountStateCache,
  isInAccountStateBatchCache,
  useAccountStateBatch,
} from "~/hooks/useAccountStateBatch";
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

export default function Stake() {
  const { addresses, isShowroom, setWalletMenuOpen } = useWallet();
  const { setChainId, setTransaction } = useTransaction();
  const [currentTransactionFlow, setCurrentTransactionFlow] = useState<
    TransactionMode | undefined
  >(undefined);
  const [stepper, setStepper] = useState(0);
  const { toast } = useToast();

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

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      {isLoading && !isInAccountStateBatchCache(displayAddresses) ? (
        <LoadingModal />
      ) : null}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Staking Portal</h1>
          <Tooltip text="Click to view the API documentation for retrieving balances">
            <a
              href="https://docs.adamik.io/api-reference/endpoint/post-apichains-chainid-validators"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
            </a>
          </Tooltip>
        </div>

        <WalletSelection />
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
        refreshPositions={() => {
          toast({ description: "Refreshing..." });
          assets.forEach((asset) => {
            clearAccountStateCache({
              chainId: asset.chainId,
              address: asset.address,
            });
          });
        }}
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
