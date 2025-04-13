"use client";

import { Info } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
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
            <div>Loading portfolio data...</div>
            <div className="text-sm text-muted-foreground">
              {isAddressesLoading ? "• Fetching addresses data" : ""}
              {isAssetDetailsLoading ? "• Loading asset details" : ""}
              {isSupportedChainsLoading ? "• Loading chain information" : ""}
              {isMobulaMarketDataLoading ? "• Fetching market data" : ""}
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
        description: "Portfolio data loaded successfully",
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

  const refreshPositions = () => {
    console.log("🔄 Starting refresh for addresses:", displayAddresses);

    let refreshToast: ReturnType<typeof toast> | undefined;
    let completedQueries = 0;
    const totalQueries = displayAddresses.length;

    // Initial toast with progress
    refreshToast = toast({
      description: (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span>Refreshing portfolio data...</span>
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

    // Clear cache and force immediate refetch for all account states
    displayAddresses.forEach(({ chainId, address }) => {
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

    console.log("♻️ Invalidating all market data queries");
    queryClient.invalidateQueries({
      queryKey: ["mobula"],
      refetchType: "all",
    });

    // Create promises for each account state query
    const promises = displayAddresses.map(({ chainId, address }) =>
      queryClient
        .fetchQuery({
          queryKey: ["accountState", chainId, address],
          queryFn: () => accountState(chainId, address),
        })
        .then(() => {
          completedQueries++;
          // Update progress toast
          const progressDescription = (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>Refreshing portfolio data...</span>
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

          if (refreshToast) {
            toast({
              ...refreshToast,
              description: progressDescription,
              duration: Infinity,
            });
          }
        })
    );

    // Wait for all queries to complete
    Promise.all(promises)
      .then(() => {
        if (refreshToast) {
          refreshToast.dismiss();
        }
        // Show success toast
        toast({
          description: "Portfolio data updated successfully",
          duration: 2000,
        });
      })
      .catch((error) => {
        if (refreshToast) {
          refreshToast.dismiss();
        }
        // Show error toast
        toast({
          description: "Failed to update some portfolio data",
          variant: "destructive",
          duration: 3000,
        });
        console.error("Error refreshing positions:", error);
      });
  };

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
