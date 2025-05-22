"use client";

import { useEffect, useMemo, useState } from "react";
import { MobulaMarketMultiDataResponse } from "~/api/mobula/marketMultiData";
import {
  getTokenContractAddresses,
  getTokenTickers,
} from "~/app/portfolio/helpers";
import { DeployAccountTransactionForm } from "~/components/transactions/DeployAccountTransactionForm";
import { TransferTransactionForm } from "~/components/transactions/TransferTransactionForm";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Modal } from "~/components/ui/modal";
import { useAccountHistory } from "~/hooks/useAccountHistory";
import { useAccountStateBatch } from "~/hooks/useAccountStateBatch";
import { useChains } from "~/hooks/useChains";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { LedgerProvider, useLedgerContext } from "~/providers/LedgerProvider";
import { formatAssetAmount } from "~/utils/assetFormatters";
import { amountToMainUnit, resolveLogo } from "~/utils/helper";
import {
  type Asset,
  Chain,
  TokenAmount,
  TransactionFees,
  TransactionMode,
} from "~/utils/types";
import { AccountInfo } from "./components/AccountInfo";
import { ConnectStarknet } from "./components/ConnectStarknet";
import { LedgerWalletSigner } from "./components/LedgerWalletSigner";
import { StarkNetAssets } from "./components/StarkNetAssets";
import { StarkNetHistory } from "./components/StarkNetHistory";

// Define StarkNet chain ID constant
const STARKNET_CHAIN_ID = "starknet";

// Inner component that uses the Ledger context and fetches data
function StarkNetWalletContent() {
  const { address, isConnected, publicKey } = useLedgerContext();
  const { data: supportedChains, isLoading: isChainsLoading } = useChains();

  // Fetch Account State
  const accountStateParams = address
    ? [{ chainId: STARKNET_CHAIN_ID, address }]
    : [];
  const {
    data: addressesData,
    isLoading: isAddressesLoading,
    error: addressesError,
  } = useAccountStateBatch(accountStateParams);

  // Fetch History
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useAccountHistory(STARKNET_CHAIN_ID, address || undefined);

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
  const accountStateData = addressesData?.[0];

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
  const combinedMarketData: MobulaMarketMultiDataResponse | null = useMemo(
    () => ({
      ...(mobulaMarketDataBySymbol || {}),
      ...(mobulaMarketDataByAddress || {}),
    }),
    [mobulaMarketDataBySymbol, mobulaMarketDataByAddress]
  );

  // --- Start: Transaction Formatting Logic ---
  const [formattedTransactions, setFormattedTransactions] = useState<
    Record<string, { formattedAmount: string; formattedFee: string }>
  >({});
  const [isFormattingAmounts, setIsFormattingAmounts] = useState(true);

  useEffect(() => {
    if (
      !starknetChain ||
      !historyData?.transactions ||
      isHistoryLoading ||
      isChainsLoading
    ) {
      if (isHistoryLoading || isChainsLoading) setIsFormattingAmounts(true);
      return;
    }
    if (historyData.transactions.length === 0) {
      setIsFormattingAmounts(false);
      setFormattedTransactions({});
      return;
    }

    setIsFormattingAmounts(true);
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

        const feeResult = await formatAssetAmount({
          asset: { chainId: STARKNET_CHAIN_ID, isToken: false },
          amount: (parsed.fees as TransactionFees).amount,
          chainData: supportedChains,
          maximumFractionDigits: 6,
        });

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
      setIsFormattingAmounts(false);
    };

    formatTransactions();
  }, [
    JSON.stringify(historyData?.transactions),
    starknetChain,
    supportedChains,
    isHistoryLoading,
    isChainsLoading,
  ]);

  // Calculate Assets array needed for Transfer Form
  const assets: Asset[] = useMemo(() => {
    if (
      !accountStateData ||
      !starknetChain ||
      !nativeDecimals ||
      !nativeTicker ||
      !combinedMarketData
    ) {
      return [];
    }

    const nativeBalance = accountStateData.balances?.native?.available;
    const tokenBalances = accountStateData.balances?.tokens || [];
    const assetsArray: Asset[] = [];

    // Add Native Asset
    if (nativeBalance) {
      const balanceMainUnit = amountToMainUnit(nativeBalance, nativeDecimals);
      const marketInfo = combinedMarketData[nativeTicker];
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
        name: starknetChain.name,
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
      const marketInfo = combinedMarketData[tokenIndex];
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
        mainChainLogo: assetsArray[0]?.logo,
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
  const [openDeployAccount, setOpenDeployAccount] = useState(false);
  const [stepper, setStepper] = useState(0);
  const [stepperDeployAccount, setStepperDeployAccount] = useState(0);

  // Effect to reset stepper when modal closes
  useEffect(() => {
    if (!openTransaction) {
      const timer = setTimeout(() => {
        setStepper(0);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [openTransaction]);

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
          handleOpenTransaction={() => setOpenTransaction(true)}
          handleOpenDeployAccount={() => setOpenDeployAccount(true)}
        />
        <StarkNetHistory
          address={address || undefined}
          historyData={historyData}
          isLoading={isHistoryLoading}
          error={historyError}
          formattedTransactions={formattedTransactions}
          isFormattingAmounts={isFormattingAmounts}
        />
      </div>

      {/* Deploy Account Modal */}
      <Modal
        open={openTransaction}
        setOpen={setOpenTransaction}
        modalContent={
          stepper === 0 &&
          !historyData?.transactions.some(
            (tx) => tx.parsed?.mode === TransactionMode.DEPLOY_ACCOUNT
          ) ? (
            <TransferTransactionForm
              assets={assets}
              onNextStep={() => {
                setStepper(1);
              }}
            />
          ) : (
            <LedgerWalletSigner
              onNextStep={() => {
                setOpenTransaction(false);
              }}
            />
          )
        }
      />

      {/* Deploy Account Modal */}
      <Modal
        open={openDeployAccount}
        setOpen={setOpenDeployAccount}
        modalContent={
          stepper === 0 &&
          !historyData?.transactions.some(
            (tx) => tx.parsed?.mode === TransactionMode.DEPLOY_ACCOUNT
          ) ? (
            <DeployAccountTransactionForm
              pubKey={publicKey || ""}
              chainId={STARKNET_CHAIN_ID}
              onNextStep={() => {
                setStepperDeployAccount(1);
              }}
            />
          ) : (
            <LedgerWalletSigner
              onNextStep={() => {
                setOpenDeployAccount(false);
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
  return (
    <main className="container mx-auto p-4 flex flex-col gap-6">
      <h1 className="text-3xl font-bold">StarkNet Ledger Integration</h1>

      <LedgerProvider>
        {/* Top Section: Connection and Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Connect Ledger</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              <p className="mb-4 text-muted-foreground">
                Connect your Ledger device to manage your StarkNet assets
                securely. Make sure you have the StarkNet app installed on your
                Ledger device.
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
      </LedgerProvider>
    </main>
  );
}
