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
import { WalletSelection } from "~/components/wallets/WalletSelection";
import { getAccountHistory } from "~/api/adamik/history";
import {
  formatAssetAmount,
  FormatAssetAmountOptions,
  FormatAssetAmountResult,
} from "~/utils/assetFormatters";
import { ParsedTransactionComponent } from "~/components/transactions/ParsedTransaction";

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
  const { isLoading: isSupportedChainsLoading, data: supportedChains } =
    useChains();
  const { data: mobulaBlockchainDetails } = useMobulaBlockchains();

  const [selectedAccount, setSelectedAccount] = useState<GroupedAccount | null>(
    null
  );
  const [transactionHistory, setTransactionHistory] = useState<{
    data: FinalizedTransaction[];
    nextPage: string | null;
  }>({
    data: [],
    nextPage: null,
  });
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const displayAddresses = isShowroom ? showroomAddresses : walletAddresses;
  const { data: addressesData, isLoading: isAddressesLoading } =
    useAccountStateBatch(displayAddresses);

  const addressesChainIds = displayAddresses.reduce<string[]>(
    (acc, { chainId }) => {
      if (acc.includes(chainId)) return acc;
      return [...acc, chainId];
    },
    []
  );

  const chainsDetails =
    supportedChains &&
    Object.values(supportedChains).filter((chain) =>
      addressesChainIds.includes(chain.id)
    );

  const mainChainTickersIds = getTickers(chainsDetails || []);
  const tokenTickers = getTokenTickers(addressesData || []);

  const { data: mobulaMarketData, isLoading: isAssetDetailsLoading } =
    useMobulaMarketMultiData(
      [...mainChainTickersIds, ...tokenTickers],
      !isSupportedChainsLoading && !isAddressesLoading,
      "symbols"
    );

  const assets = calculateAssets(
    displayAddresses,
    addressesData,
    chainsDetails || [],
    mobulaMarketData || {},
    mobulaBlockchainDetails
  );

  const groupedAccounts = useMemo(() => {
    return assets.reduce((acc, asset) => {
      if (!acc[asset.chainId]) {
        acc[asset.chainId] = {};
      }

      if (!acc[asset.chainId][asset.address]) {
        acc[asset.chainId][asset.address] = {
          address: asset.address,
          chainId: asset.chainId,
          mainAsset: asset.isToken ? null : asset,
          assets: [],
        };
      }

      if (asset.isToken) {
        acc[asset.chainId][asset.address].assets.push(asset);
      } else if (!acc[asset.chainId][asset.address].mainAsset) {
        acc[asset.chainId][asset.address].mainAsset = asset;
      }

      return acc;
    }, {} as Record<string, Record<string, GroupedAccount>>);
  }, [assets]);

  const filteredAccounts = useMemo(() => {
    return Object.values(groupedAccounts).flatMap((addresses) =>
      Object.values(addresses).filter((account) => {
        const chain = chainsDetails?.find(
          (chain: Chain) => chain.id === account.chainId
        );
        if (!chain) return false;

        const features: ChainSupportedFeatures = chain.supportedFeatures;

        // Check if the chain supports native transaction history
        return features.read?.account?.transactions?.native;
      })
    );
  }, [groupedAccounts, chainsDetails]);

  const isLoading =
    isAddressesLoading || isAssetDetailsLoading || isSupportedChainsLoading;

  const handleAccountClick = async (account: GroupedAccount) => {
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

  // Add effect to format amounts when transaction history changes
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
          (parsed.mode === "delegate" ||
            parsed.mode === "undelegate" ||
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

  // Reset selections when wallet addresses or showroom mode changes
  useEffect(() => {
    setSelectedAccount(null);
    setTransactionHistory({ data: [], nextPage: null });
  }, [walletAddresses, isShowroom]);

  // Add state to track mobile view
  const [isMobileView, setIsMobileView] = useState(false);

  // Add useEffect to detect mobile viewport
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);

    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  // Add ref for the container heights
  const accountsListRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState<number | null>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (accountsListRef.current) {
        const cardContent = accountsListRef.current.querySelector(".content");
        if (cardContent) {
          const contentHeight = cardContent.getBoundingClientRect().height;
          if (cardContent.parentElement) {
            cardContent.parentElement.style.height = "auto";
          }
          setListHeight(contentHeight);
        }
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    if (accountsListRef.current) {
      observer.observe(accountsListRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          {isMobileView && selectedAccount && (
            <button
              onClick={() => setSelectedAccount(null)}
              className="mr-3 hover:text-accent-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold md:text-2xl">
            {isMobileView && selectedAccount
              ? "Transaction History"
              : "Transaction History"}
          </h1>
          <Tooltip text="View the API documentation for retrieving transaction history">
            <a
              href="https://docs.adamik.io/api-reference/endpoint/post-apiaccounthistory"
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

      <div className="flex flex-col lg:flex-row gap-4">
        {(!isMobileView || (isMobileView && !selectedAccount)) && (
          <Card className="w-full lg:w-1/2">
            <CardHeader>
              <CardTitle>Available Accounts</CardTitle>
            </CardHeader>
            <CardContent className="content">
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : filteredAccounts.length > 0 ? (
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
                    {filteredAccounts.map((account) => (
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
                            <AvatarImage
                              src={account.mainAsset?.logo}
                              alt={account.mainAsset?.name}
                            />
                            <AvatarFallback>
                              {account.mainAsset?.name?.slice(0, 2) || "??"}
                            </AvatarFallback>
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
                      <AvatarImage
                        src={selectedAccount.mainAsset?.logo}
                        alt={selectedAccount.mainAsset?.name}
                      />
                      <AvatarFallback>
                        {selectedAccount.mainAsset?.name?.slice(0, 2) || "??"}
                      </AvatarFallback>
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
                  <Loader2 className="animate-spin" />
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
