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
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { useWallet } from "~/hooks/useWallet";
import { useChains } from "~/hooks/useChains";
import { showroomAddresses } from "../../utils/showroomAddresses";
import { aggregateStakingBalances } from "../stake/helpers";
import { WalletSelection } from "../wallets/WalletSelection";
import { WalletSigner } from "../wallets/WalletSigner";
import { AssetsBalances } from "./AssetsBalances";
import { AssetsBreakdown } from "./AssetsBreakdown";
import { AssetsList } from "./AssetsList";
import { ConnectWallet } from "./ConnectWallet";
import { TransactionForm } from "./TransactionForm";
import {
  calculateAssets,
  filterAndSortAssets,
  getTickers,
  getTokenContractAddresses,
  getTokenTickers,
} from "./helpers";

export default function Portfolio() {
  const {
    addresses: walletAddresses,
    setWalletMenuOpen: setWalletMenuOpen,
    isShowroom,
  } = useWallet();

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
    useAddressStateBatch(displayAddresses);
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

  const isLoading =
    isAddressesLoading ||
    isAssetDetailsLoading ||
    isSupportedChainsLoading ||
    isMobulaMarketDataLoading;

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
        <WalletSelection />
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
            <TransactionForm
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
