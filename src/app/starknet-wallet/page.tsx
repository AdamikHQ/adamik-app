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
import { FinalizedTransaction, Chain, TransactionFees } from "~/utils/types";
import { formatAssetAmount } from "~/utils/assetFormatters";

// Define StarkNet chain ID constant
const STARKNET_CHAIN_ID = "starknet";

// Inner component that uses the StarkNet context and fetches data
function StarkNetWalletContent() {
  const { address } = useAccount();
  const { data: supportedChains, isLoading: isChainsLoading } = useChains();

  // Find StarkNet chain details once loaded
  const starknetChain = useMemo(() => {
    if (!supportedChains) return null;
    return Object.values(supportedChains).find(
      (chain: Chain) => chain.id === STARKNET_CHAIN_ID
    );
  }, [supportedChains]);

  // Fetch History
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useAccountHistory(STARKNET_CHAIN_ID, address);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <StarkNetAssets
        nativeDecimals={starknetChain?.decimals}
        nativeTicker={starknetChain?.ticker}
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
