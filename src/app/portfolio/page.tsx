"use client";

import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingModal } from "~/components/layout/LoadingModal";
import { ShowroomBanner } from "~/components/layout/ShowroomBanner";
import { Modal } from "~/components/ui/modal";
import { Tooltip } from "~/components/ui/tooltip";
import {
  isAddressStateCache,
  useAddressStateBatch,
} from "~/hooks/useAddressStateBatch";
import { useGetChainDetailsBatch } from "~/hooks/useGetChainDetailsBatch";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { useWallet } from "~/hooks/useWallet";
import { showroomAddresses } from "../../utils/showroomAddresses";
import { aggregateStakingBalances } from "../stake/helpers";
import { WalletModalTrigger } from "../wallets/WalletModalTrigger";
import { WalletSigner } from "../wallets/WalletSigner";
import { AssetsBalances } from "./AssetsBalances";
import { AssetsBreakdown } from "./AssetsBreakdown";
import { AssetsList } from "./AssetsList";
import { ConnectWallet } from "./ConnectWallet";
import { Transaction } from "./Transaction";
import {
  calculateAssets,
  filterAndSortAssets,
  getTickers,
  getTokenContractAddresses,
  getTokenTickers,
} from "./helpers";

export default function Portfolio() {
  const {
    addresses,
    setWalletMenuOpen: setWalletMenuOpen,
    isShowroom,
  } = useWallet();

  const displayAddresses = isShowroom ? showroomAddresses : addresses;
  const chainIdsAdamik = displayAddresses.reduce<string[]>(
    (acc, { chainId }) => {
      if (acc.includes(chainId)) return acc;
      return [...acc, chainId];
    },
    []
  );
  const { data: chainsDetails, isLoading: isChainDetailsLoading } =
    useGetChainDetailsBatch(chainIdsAdamik);
  const { data, isLoading: isAddressesLoading } =
    useAddressStateBatch(displayAddresses);
  const { data: mobulaBlockchainDetails } = useMobulaBlockchains();
  const [openTransaction, setOpenTransaction] = useState(false);
  const [hideLowBalance, setHideLowBalance] = useState(true);
  const [stepper, setStepper] = useState(0);

  const mainChainTickersIds = getTickers(chainsDetails || []);
  const tokenTickers = getTokenTickers(data || []);
  const tokenContractAddresses = getTokenContractAddresses(data || []);

  const { data: mobulaMarketData, isLoading: isAssetDetailsLoading } =
    useMobulaMarketMultiData(
      [...mainChainTickersIds, ...tokenTickers],
      !isChainDetailsLoading && !isAddressesLoading,
      "symbols"
    );

  const {
    data: mobulaMarketDataContractAddresses,
    isLoading: isMobulaMarketDataLoading,
  } = useMobulaMarketMultiData(
    tokenContractAddresses,
    !isChainDetailsLoading && !isAddressesLoading,
    "assets"
  );

  const stakingBalances = useMemo(
    () => aggregateStakingBalances(data, chainsDetails, mobulaMarketData),
    [chainsDetails, data, mobulaMarketData]
  );

  const isLoading =
    isAddressesLoading ||
    isAssetDetailsLoading ||
    isChainDetailsLoading ||
    isMobulaMarketDataLoading;

  const assets = useMemo(
    () =>
      filterAndSortAssets(
        calculateAssets(
          data,
          chainsDetails,
          {
            ...mobulaMarketData,
            ...mobulaMarketDataContractAddresses,
          },
          mobulaBlockchainDetails
        ),
        hideLowBalance
      ),
    [
      mobulaBlockchainDetails,
      chainsDetails,
      data,
      mobulaMarketData,
      mobulaMarketDataContractAddresses,
      hideLowBalance,
    ]
  );

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

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      {isLoading && !isAddressStateCache(displayAddresses) ? (
        <LoadingModal />
      ) : null}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Portfolio</h1>
          <Tooltip text="View the API documentation for retrieving balances">
            <a
              href="https://docs.adamik.io/api-reference/endpoint/post-apiaddressstate"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
            </a>
          </Tooltip>
        </div>
        <WalletModalTrigger />
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
        />

        <AssetsBreakdown
          isLoading={isLoading}
          assets={assets}
          totalBalance={totalBalance}
          hideLowBalance={hideLowBalance}
          setHideLowBalance={setHideLowBalance}
        />
      </div>

      <Modal
        open={openTransaction}
        setOpen={setOpenTransaction}
        modalContent={
          // Probably need to rework
          stepper === 0 ? (
            <Transaction
              assets={assets}
              onNextStep={() => {
                setStepper(1);
              }}
            />
          ) : (
            <>
              {addresses && addresses.length > 0 ? (
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
