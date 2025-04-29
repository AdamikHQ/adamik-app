"use client";

import { useState, useEffect, useMemo } from "react";
import { Tooltip } from "~/components/ui/tooltip";
import { Info } from "lucide-react";
import { StarknetProvider } from "./components/StarknetProvider";
import { ConnectStarknet } from "./components/ConnectStarknet";
import { AccountInfo } from "./components/AccountInfo";
import { useWallet } from "~/hooks/useWallet";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { StarkNetAssets } from "./components/StarkNetAssets";
import { Modal } from "~/components/ui/modal";
import { TransferTransactionForm } from "~/components/transactions/TransferTransactionForm";
import { WalletSigner } from "~/components/wallets/WalletSigner";
import { type Asset } from "~/utils/types";
import { useAccount } from "@starknet-react/core";
import { StarkNetHistory } from "./components/StarkNetHistory";
import { useAccountHistory } from "~/hooks/useAccountHistory";
import { useChains } from "~/hooks/useChains";
import {
  FinalizedTransaction,
  Chain,
  TransactionFees,
  AccountState,
} from "~/utils/types";
import { formatAssetAmount } from "~/utils/assetFormatters";
import { useAccountStateBatch } from "~/hooks/useAccountStateBatch";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import {
  getTickers,
  getTokenTickers,
  getTokenContractAddresses,
} from "~/app/portfolio/helpers";
import { amountToMainUnit, resolveLogo, formatAmountUSD } from "~/utils/helper";

// Define StarkNet chain ID constant
const STARKNET_CHAIN_ID = "starknet";

// Inner component that uses the StarkNet context and fetches data
function StarkNetWalletContent() {
  const { address } = useAccount();
  const { data: supportedChains, isLoading: isChainsLoading } = useChains();

  // Fetch Account State
  const accountStateParams = address
    ? [{ chainId: STARKNET_CHAIN_ID, address }]
    : [];
  const {
    data: addressesData,
    isLoading: isAddressesLoading,
    error: addressesError, // Separate error for account state
  } = useAccountStateBatch(accountStateParams);

  // Fetch History
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useAccountHistory(STARKNET_CHAIN_ID, address);

  // Get StarkNet Chain Details
  const starknetChain = useMemo(() => {
    if (!supportedChains) return null;
    return Object.values(supportedChains).find(
      (chain: Chain) => chain.id === STARKNET_CHAIN_ID
    );
  }, [supportedChains]);

  // --- Start: Market Data Fetching ---
  const { data: mobulaBlockchainDetails } = useMobulaBlockchains();

  // Extract necessary data for Mobula queries - only when account data is loaded
  const accountStateData = addressesData?.[0]; // Assuming only one address for StarkNet

  const nativeTicker = starknetChain?.ticker;
  const nativeDecimals = starknetChain?.decimals;
  const tokenTickers = useMemo(
    () => (accountStateData ? getTokenTickers([accountStateData]) : []),
    [accountStateData]
  );
  const tokenContractAddresses = useMemo(
    () =>
      accountStateData ? getTokenContractAddresses([accountStateData]) : [],
    [accountStateData]
  );

  const mobulaSymbols = useMemo(
    () => (nativeTicker ? [nativeTicker, ...tokenTickers] : tokenTickers),
    [nativeTicker, tokenTickers]
  );

  // Fetch market data based on symbols and contract addresses
  const {
    data: mobulaMarketDataBySymbol,
    isLoading: isMarketDataSymbolLoading,
  } = useMobulaMarketMultiData(
    mobulaSymbols,
    !!mobulaSymbols.length,
    "symbols"
  );

  const {
    data: mobulaMarketDataByAddress,
    isLoading: isMarketDataAddressLoading,
  } = useMobulaMarketMultiData(
    tokenContractAddresses,
    !!tokenContractAddresses.length,
    "assets"
  );

  // Combine market data
  const combinedMarketData = useMemo(
    () => ({
      ...mobulaMarketDataBySymbol,
      ...mobulaMarketDataByAddress,
    }),
    [mobulaMarketDataBySymbol, mobulaMarketDataByAddress]
  );
  // --- End: Market Data Fetching ---

  // --- Start: Transaction Formatting Logic (similar to /history) ---
  const [formattedTransactions, setFormattedTransactions] = useState<
    Record<string, { formattedAmount: string; formattedFee: string }>
  >({});
  const [isFormattingAmounts, setIsFormattingAmounts] = useState(true); // Start as true

  useEffect(() => {
    // Wait for necessary data
    if (
      !starknetChain ||
      !historyData?.transactions ||
      isHistoryLoading ||
      isChainsLoading
    ) {
      // If still loading dependencies, keep formatting state true or reset if needed
      if (isHistoryLoading || isChainsLoading) setIsFormattingAmounts(true);
      return;
    }
    // Only run formatting if there are transactions
    if (historyData.transactions.length === 0) {
      setIsFormattingAmounts(false);
      setFormattedTransactions({});
      return;
    }

    setIsFormattingAmounts(true); // Set loading true before starting async formatting
    const formatTransactions = async () => {
      const formatted: Record<
        string,
        { formattedAmount: string; formattedFee: string }
      > = {};
      const transactionsToFormat = historyData.transactions.filter(
        (tx) => !!tx.parsed
      );

      for (const tx of transactionsToFormat) {
        const { parsed } = tx;
        if (!parsed) continue;

        // Format fee (assuming native)
        const feeResult = await formatAssetAmount({
          asset: { chainId: STARKNET_CHAIN_ID, isToken: false },
          amount: (parsed.fees as TransactionFees).amount, // Assuming fees is object
          chainData: supportedChains,
          maximumFractionDigits: 6,
        });

        // Format amount based on transaction type
        let amountResult: { formatted: string; ticker: string } | null = null;
        if (
          (parsed.mode === "stake" ||
            parsed.mode === "unstake" ||
            parsed.mode === "claimRewards") &&
          parsed.validators?.target
        ) {
          amountResult = await formatAssetAmount({
            asset: { chainId: STARKNET_CHAIN_ID, isToken: false },
            amount: parsed.validators.target.amount,
            chainData: supportedChains,
            maximumFractionDigits: 6,
          });
        } else if (parsed.mode === "transferToken" && parsed.tokenId) {
          amountResult = await formatAssetAmount({
            asset: {
              chainId: STARKNET_CHAIN_ID,
              isToken: true,
              assetId: parsed.tokenId,
            },
            amount: parsed.recipients?.[0]?.amount || "0",
            chainData: supportedChains,
            maximumFractionDigits: 6,
          });
        } else if (parsed.recipients?.[0]) {
          amountResult = await formatAssetAmount({
            asset: { chainId: STARKNET_CHAIN_ID, isToken: false },
            amount: parsed.recipients[0].amount,
            chainData: supportedChains,
            maximumFractionDigits: 6,
          });
        }

        formatted[parsed.id] = {
          formattedFee: `${feeResult.formatted} ${feeResult.ticker}`,
          formattedAmount: amountResult
            ? `${amountResult.formatted} ${amountResult.ticker}`
            : "",
        };
      }
      setFormattedTransactions(formatted);
      setIsFormattingAmounts(false); // Set loading false after formatting
    };

    formatTransactions();
    // Depend on transactions array content (JSON stringify for deep comparison) and chain data
  }, [
    JSON.stringify(historyData?.transactions),
    starknetChain,
    supportedChains,
    isHistoryLoading,
    isChainsLoading,
  ]);
  // --- End: Transaction Formatting Logic ---

  // Calculate Assets array needed for Transfer Form
  const assets: Asset[] = useMemo(() => {
    if (
      !accountStateData ||
      !starknetChain ||
      !nativeDecimals ||
      !nativeTicker
    ) {
      return [];
    }

    const nativeBalance = accountStateData.balances?.native?.available;
    const tokenBalances = accountStateData.balances?.tokens || [];
    const assetsArray: Asset[] = [];

    // Add Native Asset
    if (nativeBalance) {
      const balanceMainUnit = amountToMainUnit(nativeBalance, nativeDecimals);
      const marketInfo = combinedMarketData
        ? combinedMarketData[nativeTicker]
        : null;
      const balanceUSD =
        marketInfo && balanceMainUnit
          ? marketInfo.price * parseFloat(balanceMainUnit)
          : undefined;
      const logo = resolveLogo({
        asset: { name: nativeTicker, ticker: nativeTicker },
        mobulaMarketData: combinedMarketData,
        mobulaBlockChainData: mobulaBlockchainDetails,
      });

      assetsArray.push({
        logo,
        chainId: STARKNET_CHAIN_ID,
        name: starknetChain.name, // Use chain name
        balanceMainUnit,
        balanceUSD,
        ticker: nativeTicker,
        address: accountStateData.accountId,
        decimals: nativeDecimals,
        isToken: false,
      });
    }

    // Add Token Assets
    tokenBalances.forEach((tokenAmount: TokenAmount) => {
      const token = tokenAmount.token;
      const balanceMainUnit = amountToMainUnit(
        tokenAmount.amount,
        token.decimals
      );
      const tokenIndex = token.contractAddress ?? token.ticker;
      const marketInfo = combinedMarketData
        ? combinedMarketData[tokenIndex]
        : null;
      const balanceUSD =
        marketInfo && balanceMainUnit
          ? marketInfo.price * parseFloat(balanceMainUnit)
          : undefined;
      const logo = resolveLogo({
        asset: { name: token.name || "", ticker: tokenIndex },
        mobulaMarketData: combinedMarketData,
        mobulaBlockChainData: mobulaBlockchainDetails,
      });

      assetsArray.push({
        logo,
        mainChainLogo: assetsArray[0]?.logo, // Use native logo as main chain logo
        mainChainName: starknetChain.name,
        chainId: STARKNET_CHAIN_ID,
        assetId: token.id,
        name: token.name,
        balanceMainUnit,
        balanceUSD,
        ticker: token.ticker,
        address: accountStateData.accountId,
        contractAddress: token.contractAddress,
        decimals: token.decimals,
        isToken: true,
      });
    });

    return assetsArray;
  }, [
    accountStateData,
    starknetChain,
    nativeDecimals,
    nativeTicker,
    combinedMarketData,
    mobulaBlockchainDetails,
  ]);

  // Modal State & Handlers
  const [openTransaction, setOpenTransaction] = useState(false);
  const [stepper, setStepper] = useState(0);

  const handleOpenTransaction = (isOpen: boolean) => {
    // Reset stepper when closing
    if (!isOpen) {
      setStepper(0);
    }
    setOpenTransaction(isOpen);
  };

  // Combine all loading states for children
  const isOverviewLoading =
    isAddressesLoading ||
    isChainsLoading ||
    isMarketDataSymbolLoading ||
    isMarketDataAddressLoading;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StarkNetAssets
          isLoading={isOverviewLoading}
          accountData={accountStateData}
          error={addressesError}
          nativeDecimals={nativeDecimals}
          nativeTicker={nativeTicker}
          mobulaMarketData={combinedMarketData}
          mobulaBlockchainDetails={mobulaBlockchainDetails}
          handleOpenTransaction={handleOpenTransaction}
        />
        <StarkNetHistory
          address={address}
          historyData={historyData}
          isLoading={isHistoryLoading}
          error={historyError}
          formattedTransactions={formattedTransactions}
          isFormattingAmounts={isFormattingAmounts}
        />
      </div>

      {/* Transfer Modal */}
      <Modal
        open={openTransaction}
        setOpen={handleOpenTransaction} // Use handler here
        modalContent={
          stepper === 0 ? (
            <TransferTransactionForm
              assets={assets} // Pass calculated assets
              onNextStep={() => {
                setStepper(1);
              }}
            />
          ) : (
            <WalletSigner
              onNextStep={() => {
                handleOpenTransaction(false); // Use handler to close and reset
                // Optional delay if needed
                // setTimeout(() => {
                //   setStepper(0);
                // }, 200);
              }}
            />
          )
        }
      />
    </>
  );
}

// Main Page Component
export default function StarkNetWallet() {
  const { isShowroom } = useWallet();

  return (
    <main className="container mx-auto p-4 flex flex-col gap-6">
      <h1 className="text-3xl font-bold">StarkNet Wallet Integration</h1>

      <StarknetProvider>
        {/* Top Section: Connection and Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              <p className="mb-4 text-muted-foreground">
                The integration uses Argent-Web for connection and signing, the
                Adamik API will be used for all data retrieval and transaction
                lifecycle.
              </p>
              <div className="mt-auto">
                <ConnectStarknet />
              </div>
            </CardContent>
          </Card>
          <div>
            <AccountInfo />
          </div>
        </div>

        {/* Render the inner component that uses the context */}
        <StarkNetWalletContent />
      </StarknetProvider>

      {/* Transaction Modal - Removed */}
    </main>
  );
}
