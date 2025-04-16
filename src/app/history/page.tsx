"use client";

import {
  Suspense,
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Info, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { Tooltip } from "~/components/ui/tooltip";
import { useWallet } from "~/hooks/useWallet";
import { useChains } from "~/hooks/useChains";
import { showroomAddresses } from "../../utils/showroomAddresses";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Chain,
  ChainSupportedFeatures,
  Asset,
  ParsedTransaction,
  FinalizedTransaction,
} from "~/utils/types";
import { useAccountStateBatch } from "~/hooks/useAccountStateBatch";
import {
  calculateAssets,
  getTickers,
  getTokenTickers,
} from "../portfolio/helpers";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { ShowroomBanner } from "~/components/layout/ShowroomBanner";
import { getAccountHistory } from "~/api/adamik/history";
import {
  formatAssetAmount,
  FormatAssetAmountOptions,
  FormatAssetAmountResult,
} from "~/utils/assetFormatters";
import { ParsedTransactionComponent } from "~/components/transactions/ParsedTransaction";
import { WalletConnect } from "~/components";
import { TransactionHistoryPlaceholder } from "./TransactionHistoryPlaceholder";

// Function to generate a consistent background color based on chain ID
const getChainColor = (chainId: string): string => {
  // Common blockchain families and their associated colors
  const chainColors: Record<string, string> = {
    // EVM chains - blue family
    ethereum: "bg-blue-500",
    optimism: "bg-red-500",
    arbitrum: "bg-blue-400",
    polygon: "bg-purple-500",
    base: "bg-blue-600",
    avalanche: "bg-red-600",

    // Cosmos chains - purple family
    cosmoshub: "bg-indigo-500",
    osmosis: "bg-purple-600",
    dydx: "bg-violet-500",

    // Other major chains
    bitcoin: "bg-amber-500",
    solana: "bg-gradient-to-r from-purple-600 to-green-500",
    ton: "bg-sky-500",
    near: "bg-gray-800",
    tron: "bg-red-500",
  };

  // Extract the main part of the chain ID (before any hyphens)
  const mainChainId = chainId.split("-")[0].toLowerCase();

  // Return predefined color or a fallback based on first character
  return chainColors[mainChainId] || "bg-slate-600";
};

type GroupedAccount = {
  address: string;
  chainId: string;
  mainAsset: Asset | null;
  assets: Asset[];
};

function TransactionHistoryContent() {
  const {
    addresses: walletAddresses,
    isShowroom,
    setShowroom,
    setWalletMenuOpen,
  } = useWallet();

  // Only fetch essential chain data for determining history support
  const { isLoading: isSupportedChainsLoading, data: supportedChains } =
    useChains();

  const displayAddresses = isShowroom ? showroomAddresses : walletAddresses;

  // Initial loading state only depends on chains data
  const isInitialLoading = isSupportedChainsLoading;

  // Simple filtering for accounts that support transaction history
  const filteredChainIds = useMemo(() => {
    if (!supportedChains) return [];

    return Object.entries(supportedChains)
      .filter(
        ([_, chain]) =>
          chain.supportedFeatures?.read?.account?.transactions?.native
      )
      .map(([chainId]) => chainId);
  }, [supportedChains]);

  // Filter addresses based on supported chains
  const supportedAddresses = useMemo(() => {
    return displayAddresses.filter((addr) =>
      filteredChainIds.includes(addr.chainId)
    );
  }, [displayAddresses, filteredChainIds]);

  // Get chain tickers for icon loading
  const chainTickers = useMemo(() => {
    if (!supportedChains) return [];

    return filteredChainIds
      .map((chainId) => {
        const chain = supportedChains[chainId];
        return chain?.ticker || chainId;
      })
      .filter(Boolean);
  }, [supportedChains, filteredChainIds]);

  // Only fetch market data for chain icons - without fetching account details
  const { data: chainIconData, isLoading: isIconDataLoading } =
    useMobulaMarketMultiData(
      chainTickers,
      !isSupportedChainsLoading && chainTickers.length > 0,
      "symbols"
    );

  // Fetch blockchain details for icons
  const { data: mobulaBlockchainDetails } = useMobulaBlockchains();

  // Map chain logos for display
  const chainLogos = useMemo(() => {
    const logos: { [key: string]: string } = {};

    // Skip if we don't have the necessary data
    if (!supportedChains) return logos;

    // Try to find logos for each chain
    for (const chainId of filteredChainIds) {
      const chain = supportedChains[chainId];
      if (!chain) continue;

      // Try to get logo from market data
      if (chain.ticker && chainIconData) {
        // Safe access with optional chaining
        const logo = (chainIconData as any)?.[chain.ticker]?.logo;
        if (logo) {
          logos[chainId] = logo;
          continue;
        }
      }

      // Try to find in blockchain details
      if (mobulaBlockchainDetails && Array.isArray(mobulaBlockchainDetails)) {
        // Using any type for blockchain detail to avoid property errors
        const blockchainDetail = mobulaBlockchainDetails.find(
          (bc: any) =>
            bc.name?.toLowerCase() === chain.name?.toLowerCase() ||
            bc.symbol?.toLowerCase() === chain.ticker?.toLowerCase()
        );
        if (blockchainDetail?.logo) {
          logos[chainId] = blockchainDetail.logo;
        }
      }
    }

    return logos;
  }, [
    supportedChains,
    filteredChainIds,
    chainIconData,
    mobulaBlockchainDetails,
  ]);

  // Define essential state
  const [selectedAccount, setSelectedAccount] = useState<{
    address: string;
    chainId: string;
  } | null>(null);

  const [transactionHistory, setTransactionHistory] = useState<{
    data: FinalizedTransaction[];
    nextPage: string | null;
  }>({
    data: [],
    nextPage: null,
  });

  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  // Add state to track mobile view
  const [isMobileView, setIsMobileView] = useState(false);

  // Only fetch account data when specifically needed, not on initial load
  const skipAccountFetch = !selectedAccount;
  const { data: addressesData, isLoading: isAddressesLoading } =
    useAccountStateBatch(skipAccountFetch ? [] : displayAddresses);

  const handleAccountClick = async (account: {
    address: string;
    chainId: string;
  }) => {
    setSelectedAccount(account);
    setIsFetchingHistory(true);
    setTransactionHistory({ data: [], nextPage: null });

    try {
      const history = await getAccountHistory(account.chainId, account.address);

      if (history) {
        setTransactionHistory({
          data: history.transactions,
          nextPage: history.pagination?.nextPage || null,
        });
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  // Add useEffect to detect mobile viewport
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);

    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  // Track what accounts have been clicked
  const [formattedTransactions, setFormattedTransactions] = useState<
    Record<
      string,
      {
        formattedAmount: string;
        formattedFee: string;
      }
    >
  >({});
  const [isFormattingAmounts, setIsFormattingAmounts] = useState(true);

  // Reset selections when wallet addresses or showroom mode changes
  useEffect(() => {
    setSelectedAccount(null);
    setTransactionHistory({ data: [], nextPage: null });
  }, [walletAddresses, isShowroom]);

  // Add ref for the container heights
  const accountsListRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState<number | null>(null);

  const transactionListRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(async () => {
    if (!selectedAccount || isFetchingHistory) return;

    const scrollPosition = transactionListRef.current?.scrollTop;

    try {
      setIsFetchingHistory(true);
      const result = await getAccountHistory(
        selectedAccount.chainId,
        selectedAccount.address,
        { nextPage: transactionHistory.nextPage || undefined }
      );

      if (result) {
        setTransactionHistory((prev) => ({
          data: [...prev.data, ...result.transactions],
          nextPage: result.pagination?.nextPage || null,
        }));

        requestAnimationFrame(() => {
          if (transactionListRef.current && scrollPosition) {
            transactionListRef.current.scrollTop = scrollPosition;
          }
        });
      }
    } catch (error) {
      console.error("Error loading more transactions:", error);
    } finally {
      setIsFetchingHistory(false);
    }
  }, [selectedAccount, isFetchingHistory, transactionHistory.nextPage]);

  // Format transaction amounts
  useEffect(() => {
    if (!selectedAccount || !transactionHistory?.data || isFetchingHistory)
      return;
    setIsFormattingAmounts(true);

    const formatTransactions = async () => {
      const formatted: Record<
        string,
        { formattedAmount: string; formattedFee: string }
      > = {};

      for (const tx of transactionHistory.data) {
        const { parsed } = tx;

        if (!parsed) {
          continue;
        }

        // Format fee
        const feeResult = await formatAssetAmount({
          asset: {
            chainId: selectedAccount.chainId,
            isToken: false,
          },
          amount: parsed.fees.amount,
          chainData: supportedChains,
          maximumFractionDigits: 6,
        });

        // Format amount based on transaction type
        let amountResult: FormatAssetAmountResult | null = null;

        if (
          (parsed.mode === "stake" ||
            parsed.mode === "unstake" ||
            parsed.mode === "claimRewards") &&
          parsed.validators?.target
        ) {
          amountResult = await formatAssetAmount({
            asset: {
              chainId: selectedAccount.chainId,
              isToken: false,
            },
            amount: parsed.validators.target.amount,
            chainData: supportedChains,
            maximumFractionDigits: 6,
          });
        } else if (parsed.mode === "transferToken" && parsed.tokenId) {
          amountResult = await formatAssetAmount({
            asset: {
              chainId: selectedAccount.chainId,
              isToken: true,
              assetId: parsed.tokenId,
            },
            amount: parsed.recipients?.[0]?.amount || "0",
            chainData: supportedChains,
            maximumFractionDigits: 6,
          });
        } else if (parsed.recipients?.[0]) {
          amountResult = await formatAssetAmount({
            asset: {
              chainId: selectedAccount.chainId,
              isToken: false,
            },
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
  }, [transactionHistory, supportedChains, isFetchingHistory, selectedAccount]);

  // Container height updates
  useEffect(() => {
    const updateHeight = () => {
      const cardContent = document.querySelector(".history-content");
      if (cardContent) {
        const contentHeight = cardContent.getBoundingClientRect().height;
        if (contentHeight > 0) {
          setListHeight(contentHeight);
        }
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    const cardContent = document.querySelector(".history-content");
    if (cardContent) {
      observer.observe(cardContent);
    }

    return () => observer.disconnect();
  }, []);

  // Render the content
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">
            Transaction History
          </h1>
          <Tooltip text="View the API documentation for transaction history">
            <a
              href="https://docs.adamik.io/api-reference/account/get-account-history"
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

      {isInitialLoading ? (
        <TransactionHistoryPlaceholder
          accounts={displayAddresses}
          chains={supportedChains}
          isMobileView={isMobileView}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {(!isMobileView || (isMobileView && !selectedAccount)) && (
            <Card className="w-full lg:w-1/2">
              <CardHeader>
                <CardTitle>Available Accounts</CardTitle>
              </CardHeader>
              <CardContent className="history-content">
                {supportedAddresses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]"></TableHead>
                        <TableHead>
                          <span className="hidden sm:inline">Address</span>
                          <span className="sm:hidden">Addr.</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supportedAddresses.map((account) => (
                        <TableRow
                          key={`${account.chainId}-${account.address}`}
                          className={`cursor-pointer transition-colors ${
                            selectedAccount?.address === account.address &&
                            selectedAccount?.chainId === account.chainId
                              ? "bg-accent/80 hover:bg-accent"
                              : "hover:bg-accent/50"
                          }`}
                          onClick={() => handleAccountClick(account)}
                        >
                          <TableCell>
                            <Avatar className="w-[38px] h-[38px]">
                              {chainLogos[account.chainId] ? (
                                <AvatarImage
                                  src={chainLogos[account.chainId]}
                                  alt={account.chainId}
                                />
                              ) : (
                                <AvatarFallback
                                  className={`${getChainColor(
                                    account.chainId
                                  )} text-white`}
                                >
                                  {account.chainId
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </TableCell>
                          <TableCell className="flex justify-between items-center">
                            <p
                              className={
                                selectedAccount?.address === account.address &&
                                selectedAccount?.chainId === account.chainId
                                  ? "font-medium"
                                  : ""
                              }
                            >
                              {account.address}
                            </p>
                            <ChevronRight
                              className={`w-4 h-4 ${
                                selectedAccount?.address === account.address &&
                                selectedAccount?.chainId === account.chainId
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm">
                    No accounts found with transaction history support. Please
                    connect a wallet with supported chains.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {(!isMobileView || (isMobileView && selectedAccount)) && (
            <Card className="w-full lg:w-1/2">
              <CardHeader>
                {isMobileView && selectedAccount && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-[38px] h-[38px]">
                        {selectedAccount &&
                        chainLogos[selectedAccount.chainId] ? (
                          <AvatarImage
                            src={chainLogos[selectedAccount.chainId]}
                            alt={selectedAccount.chainId}
                          />
                        ) : (
                          <AvatarFallback
                            className={`${getChainColor(
                              selectedAccount.chainId
                            )} text-white`}
                          >
                            {selectedAccount.chainId
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">Selected Account</p>
                        <p className="text-muted-foreground">
                          {`${selectedAccount.address.slice(
                            0,
                            6
                          )}...${selectedAccount.address.slice(-4)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CardTitle>Transaction History</CardTitle>
                  {transactionHistory && !isFetchingHistory && (
                    <span className="text-sm text-muted-foreground">
                      ({transactionHistory.data.length} operations)
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedAccount ? (
                  isFetchingHistory ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        Fetching transaction history...
                      </p>
                    </div>
                  ) : transactionHistory ? (
                    <div
                      className="space-y-4 px-1 h-full"
                      style={{
                        minHeight: "200px",
                        height: isMobileView
                          ? "400px"
                          : listHeight
                          ? `${Math.min(listHeight, 600)}px`
                          : "600px",
                        overflowY: "auto",
                      }}
                    >
                      {transactionHistory.data
                        .filter((tx) => !!tx.parsed)
                        .map((tx: FinalizedTransaction) => (
                          <div key={tx.parsed!.id}>
                            <ParsedTransactionComponent
                              tx={tx.parsed!}
                              selectedAccountChainId={selectedAccount?.chainId}
                              formattedTransactions={formattedTransactions}
                              isFormattingAmounts={isFormattingAmounts}
                            />
                          </div>
                        ))}

                      {transactionHistory.nextPage && (
                        <div className="flex justify-center py-4">
                          <button
                            onClick={handleLoadMore}
                            disabled={isFetchingHistory}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isFetchingHistory ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Load More"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm">No transaction history available.</p>
                  )
                ) : (
                  <p className="text-sm">
                    Select an account to view its transaction history.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}

export default function TransactionHistory() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TransactionHistoryContent />
    </Suspense>
  );
}
