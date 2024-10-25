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

  const formatAmount = (amount: string, ticker: string) => {
    // Convert from base units (like wei or uatom) to main units
    const decimals = ticker.startsWith("u") ? 6 : 18;
    const value = Number(amount) / Math.pow(10, decimals);
    return `${value.toLocaleString(undefined, {
      maximumFractionDigits: 6,
    })} ${ticker.replace("u", "")}`;
  };

  const getTransactionTypeIcon = (mode: string) => {
    switch (mode) {
      case "transfer":
        return <Send className="w-5 h-5" />; // Icon for transfer
      case "transferToken":
        return <SendHorizonal className="w-5 h-5" />; // Icon for token transfer
      case "delegate":
        return <HandshakeIcon className="w-5 h-5" />; // Icon for delegate
      case "undelegate":
        return <LogOut className="w-5 h-5" />; // Icon for undelegate
      case "claimRewards":
        return <HandCoins className="w-5 h-5" />; // Icon for claim rewards
      default:
        return <HelpCircle className="w-5 h-5" />; // Icon for unknown
    }
  };

  const renderTransaction = (tx: ParsedTransaction) => {
    const { parsed } = tx;
    const time = formatDistanceToNow(new Date(Number(parsed.timestamp)), {
      addSuffix: true,
    });

    return (
      <div
        key={parsed.id}
        className="border-b border-gray-800 p-4 hover:bg-gray-900/50"
      >
        <div className="flex items-center justify-between mb-2">
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
          <span className="text-sm text-gray-400">{time}</span>
        </div>

        {parsed.senders && parsed.recipients && (
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">From:</span>
              <span className="font-mono">{parsed.senders[0].address}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">To:</span>
              <span className="font-mono">{parsed.recipients[0].address}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Amount:</span>
              <span>
                {formatAmount(parsed.recipients[0].amount, parsed.fees.ticker)}
              </span>
            </div>
          </div>
        )}

        {parsed.validators && (
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Validator:</span>
              <span className="font-mono">
                {parsed.validators.target.address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Amount:</span>
              <span>
                {formatAmount(
                  parsed.validators.target.amount,
                  parsed.fees.ticker
                )}
              </span>
            </div>
          </div>
        )}

        <div className="mt-2 text-sm text-gray-400">
          Fee: {formatAmount(parsed.fees.amount, parsed.fees.ticker)}
        </div>
      </div>
    );
  };

  // Reset selections when wallet addresses or showroom mode changes
  useEffect(() => {
    setSelectedAccount(null);
    setTransactionHistory(null);
  }, [walletAddresses, isShowroom]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">
            Transaction History
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

      <div className="flex gap-4">
        <Card className="w-1/2">
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
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow
                      key={`${account.chainId}-${account.address}`}
                      className="cursor-pointer hover:bg-gray-800"
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
                        <p>{account.address}</p>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>
                No accounts found with transaction history support. Please
                connect a wallet with supported chains.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="w-1/2">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAccount ? (
              isFetchingHistory ? (
                <Loader2 className="animate-spin" />
              ) : transactionHistory ? (
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {transactionHistory.transactions.map(
                    (tx: ParsedTransaction) => renderTransaction(tx)
                  )}
                </div>
              ) : (
                <p>No transaction history available.</p>
              )
            ) : (
              <p>Select an account to view its transaction history.</p>
            )}
          </CardContent>
        </Card>
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
