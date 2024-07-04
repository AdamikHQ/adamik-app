"use client";

import { useMemo, useState } from "react";
import { Modal } from "~/components/ui/modal";
import {
  isAddressStateCache,
  useAddressStateBatch,
} from "~/hooks/useAddressStateBatch";
import { useGetChainDetailsBatch } from "~/hooks/useGetChainDetailsBatch";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { useWallet } from "~/hooks/useWallet";
import { AssetsBalances } from "./AssetsBalances";
import { AssetsList } from "./AssetsList";
import { AssetsBreakdown } from "./AssetsBreakdown";
import { ConnectWallet } from "./ConnectWallet";
import { Transaction } from "./Transaction";
import {
  calculateAssets,
  getTickers,
  getTokenContractAddresses,
  getTokenTickers,
} from "./helpers";
import { showroomAddresses } from "../../utils/showroomAddresses";
import { aggregateStakingBalances } from "../stake/helpers";
import { LoadingModal } from "~/components/layout/LoadingModal";
import { TransactionProvider } from "~/providers/TransactionProvider";
import { WalletSigner } from "../wallets/WalletSigner";

export default function Portfolio() {
  const { addresses, setWalletMenuOpen: setWalletMenuOpen } = useWallet();

  const displayAddresses = addresses.length > 0 ? addresses : showroomAddresses;
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
      calculateAssets(
        data,
        chainsDetails,
        {
          ...mobulaMarketData,
          ...mobulaMarketDataContractAddresses,
        },
        mobulaBlockchainDetails
      ),
    [
      mobulaBlockchainDetails,
      chainsDetails,
      data,
      mobulaMarketData,
      mobulaMarketDataContractAddresses,
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
      <TransactionProvider>
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
          />

          <AssetsBreakdown
            isLoading={isLoading}
            assets={assets}
            totalBalance={totalBalance}
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
      </TransactionProvider>
    </main>
  );
}
