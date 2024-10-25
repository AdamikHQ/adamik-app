"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import {
  Info,
  Loader2,
  ChevronRight,
  Send,
  Download,
  HelpCircle,
  SendHorizonal,
  HandshakeIcon,
  HandCoins,
  LogOut,
  Search,
  ChevronLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
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
import { Chain, ChainSupportedFeatures, Asset } from "~/utils/types";
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
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  formatAssetAmount,
  FormatAssetAmountOptions,
  FormatAssetAmountResult,
} from "~/utils/assetFormatters";

type GroupedAccount = {
  address: string;
  chainId: string;
  mainAsset: Asset | null;
  assets: Asset[];
};

type ParsedTransaction = {
  parsed: {
    id: string;
    mode: string;
    state: string;
    timestamp: string;
    fees: {
      amount: string;
      ticker: string;
    };
    senders?: Array<{ address: string }>;
    recipients?: Array<{ address: string; amount: string }>;
    validators?: {
      target: {
        address: string;
        amount: string;
      };
    };
  };
};

const getTransactionTypeIcon = (mode: string) => {
  switch (mode) {
    case "transferToken":
    case "transfer":
      return <Send className="w-4 h-4" />;
    case "delegate":
      return <HandshakeIcon className="w-4 h-4" />;
    case "undelegate":
      return <LogOut className="w-4 h-4" />;
    case "claimRewards":
      return <HandCoins className="w-4 h-4" />;
    default:
      return <HelpCircle className="w-4 h-4" />;
  }
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
  const [transactionHistory, setTransactionHistory] = useState<any>(null);
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

    try {
      const history = await getAccountHistory(account.chainId, account.address);
      setTransactionHistory(history);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      setTransactionHistory(null);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  // Add state for formatted amounts
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
    if (!transactionHistory?.transactions || isFetchingHistory) return;
    setIsFormattingAmounts(true);

    const formatTransactions = async () => {
      const formatted: Record<
        string,
        { formattedAmount: string; formattedFee: string }
      > = {};

      for (const tx of transactionHistory.transactions) {
        const { parsed } = tx;

        // Format fee
        const feeResult = await formatAssetAmount({
          asset: { chainId: parsed.chainId, type: "native" },
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
            asset: { chainId: parsed.chainId, type: "native" },
            amount: parsed.validators.target.amount,
            chainData: supportedChains,
            maximumFractionDigits: 6,
          });
        } else if (parsed.mode === "transferToken" && parsed.tokenId) {
          amountResult = await formatAssetAmount({
            asset: {
              chainId: parsed.chainId,
              type: "token",
              tokenId: parsed.tokenId,
            },
            amount: parsed.recipients?.[0]?.amount || "0",
            chainData: supportedChains,
            maximumFractionDigits: 6,
          });
        } else if (parsed.recipients?.[0]) {
          amountResult = await formatAssetAmount({
            asset: { chainId: parsed.chainId, type: "native" },
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
  }, [transactionHistory, supportedChains, isFetchingHistory]);

  // Update renderTransaction to use formatted amounts
  const renderTransaction = (tx: ParsedTransaction) => {
    const { parsed } = tx;
    const formatted = formattedTransactions[parsed.id] || {
      formattedAmount: "",
      formattedFee: "",
    };

    return (
      <div className="p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {getTransactionTypeIcon(parsed.mode)}
            </span>
            <span className="capitalize font-medium">{parsed.mode}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                parsed.state === "confirmed"
                  ? "bg-green-900/50 text-green-300"
                  : "bg-red-900/50 text-red-300"
              }`}
            >
              {parsed.state}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(Number(parsed.timestamp)), {
                addSuffix: true,
              })}
            </span>
            <Link
              href={`/data?chainId=${selectedAccount?.chainId}&transactionId=${parsed.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {parsed.senders && parsed.recipients && (
          <div className="space-y-2 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-muted-foreground w-16">From:</span>
              <span className="font-mono break-all">
                <span className="sm:hidden">
                  {`${parsed.senders[0].address.slice(
                    0,
                    6
                  )}...${parsed.senders[0].address.slice(-4)}`}
                </span>
                <span className="hidden sm:inline">
                  {parsed.senders[0].address}
                </span>
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-muted-foreground w-16">To:</span>
              <span className="font-mono break-all">
                <span className="sm:hidden">
                  {`${parsed.recipients[0].address.slice(
                    0,
                    6
                  )}...${parsed.recipients[0].address.slice(-4)}`}
                </span>
                <span className="hidden sm:inline">
                  {parsed.recipients[0].address}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16">
                {parsed.mode === "claimRewards" ? "Claimed:" : "Amount:"}
              </span>
              {isFormattingAmounts ? (
                <div className="h-5 w-24 animate-pulse bg-accent/50 rounded" />
              ) : (
                <span className="font-medium">{formatted.formattedAmount}</span>
              )}
            </div>
          </div>
        )}

        {parsed.validators && (
          <div className="space-y-2 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-muted-foreground w-16">Validator:</span>
              <span className="font-mono break-all">
                <span className="sm:hidden">
                  {`${parsed.validators.target.address.slice(
                    0,
                    6
                  )}...${parsed.validators.target.address.slice(-4)}`}
                </span>
                <span className="hidden sm:inline">
                  {parsed.validators.target.address}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16">Amount:</span>
              <span className="font-medium">
                {isFormattingAmounts ? (
                  <div className="inline-block h-4 w-16 animate-pulse bg-accent/50 rounded" />
                ) : (
                  formatted.formattedAmount
                )}
              </span>
            </div>
          </div>
        )}

        <div className="mt-3 text-sm text-muted-foreground">
          Fee:{" "}
          {isFormattingAmounts ? (
            <div className="inline-block h-4 w-16 animate-pulse bg-accent/50 rounded" />
          ) : (
            formatted.formattedFee
          )}
        </div>
      </div>
    );
  };

  // Reset selections when wallet addresses or showroom mode changes
  useEffect(() => {
    setSelectedAccount(null);
    setTransactionHistory(null);
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

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          {/* Show back button on mobile when viewing transactions */}
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

      {/* Main content - Conditional rendering based on viewport and selection */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Show accounts list if: desktop OR (mobile AND no selection) */}
        {(!isMobileView || (isMobileView && !selectedAccount)) && (
          <Card className="w-full lg:w-1/2">
            <CardHeader>
              <CardTitle>Available Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : filteredAccounts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]"></TableHead>
                      {/* Hide full address on mobile, show truncated version */}
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
                          selectedAccount?.chainId === account.chainId // Add chainId check
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
                              selectedAccount?.chainId === account.chainId // Add chainId check
                                ? "font-medium"
                                : ""
                            }
                          >
                            {account.address}
                          </p>
                          <ChevronRight
                            className={`w-4 h-4 ${
                              selectedAccount?.address === account.address &&
                              selectedAccount?.chainId === account.chainId // Add chainId check
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

        {/* Show transaction history if: desktop OR (mobile AND has selection) */}
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
                    ({transactionHistory.transactions.length} operations)
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedAccount ? (
                isFetchingHistory ? (
                  <Loader2 className="animate-spin" />
                ) : transactionHistory ? (
                  <div className="space-y-4 max-h-[400px] lg:max-h-[600px] overflow-y-auto px-1">
                    {transactionHistory.transactions.map(
                      (tx: ParsedTransaction) => (
                        <div key={tx.parsed.id}>{renderTransaction(tx)}</div>
                      )
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
