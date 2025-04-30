"use client";

import { Info } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { LoadingModal } from "~/components/layout/LoadingModal";
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

// Helper function to get from localStorage (can be moved to a util file)
const getLocalStorageItem = (key: string, defaultValue: boolean): boolean => {
  if (typeof window === "undefined") return defaultValue;
  const storedValue = localStorage.getItem(key);
  return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
};

export default function Portfolio() {
  const {
    addresses: walletAddresses,
    setWalletMenuOpen: setWalletMenuOpen,
    isShowroom,
  } = useWallet();

  const { toast } = useToast();
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
  const [stepper, setStepper] = useState(0);

  // State to hold the setting value
  const [showLowBalances, setShowLowBalances] = useState<boolean>(true); // Default to true

  // Effect to read from localStorage on mount
  useEffect(() => {
    setShowLowBalances(getLocalStorageItem("showLowBalances", true));
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
      !showLowBalances // Use the setting value here (negated, as original state was hideLowBalance)
    );
  }, [
    mobulaBlockchainDetails,
    chainsDetails,
    addressesData,
    displayAddresses,
    mobulaMarketData,
    mobulaMarketDataContractAddresses,
    showLowBalances, // Add dependency
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

  const refreshPositions = () => {
    toast({ description: "Refreshing portfolio..." });
    assets.forEach((asset) => {
      clearAccountStateCache({
        chainId: asset.chainId,
        address: asset.address,
      });
    });
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      {isLoading && !isInAccountStateBatchCache(displayAddresses) ? (
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
          hideLowBalance={!showLowBalances} // Pass the setting value (negated)
          refreshPositions={refreshPositions}
        />

        <AssetsBreakdown
          isLoading={isLoading}
          assets={assets}
          totalBalance={totalBalance}
          hideLowBalance={!showLowBalances} // Pass the setting value (negated)
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
