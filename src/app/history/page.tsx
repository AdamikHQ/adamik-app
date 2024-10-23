"use client";

import { Suspense, useMemo } from "react";
import { Info, Loader2 } from "lucide-react";
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
import { Asset } from "~/utils/types";
import { useAccountStateBatch } from "~/hooks/useAccountStateBatch";
import {
  calculateAssets,
  getTickers,
  getTokenTickers,
} from "../portfolio/helpers";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { Chain, ChainSupportedFeatures } from "~/utils/types";

function TransactionHistoryContent() {
  const { addresses: walletAddresses, isShowroom } = useWallet();
  const { isLoading: isSupportedChainsLoading, data: supportedChains } =
    useChains();
  const { data: mobulaBlockchainDetails } = useMobulaBlockchains();

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
      if (!acc[asset.address]) {
        acc[asset.address] = {
          address: asset.address,
          chainId: asset.chainId,
          mainAsset: asset.isToken ? null : asset,
          assets: [],
        };
      }
      if (asset.isToken) {
        acc[asset.address].assets.push(asset);
      } else if (!acc[asset.address].mainAsset) {
        acc[asset.address].mainAsset = asset;
      }
      return acc;
    }, {} as Record<string, { address: string; chainId: string; mainAsset: Asset | null; assets: Asset[] }>);
  }, [assets]);

  const filteredAccounts = useMemo(() => {
    return Object.values(groupedAccounts).filter((account) => {
      const chain = chainsDetails?.find(
        (chain: Chain) => chain.id === account.chainId
      );
      if (!chain) return false;

      const features: ChainSupportedFeatures = chain.supportedFeatures;

      // Check if the read.account.transactions field exists
      if (!features.read?.account?.transactions) {
        return false;
      }

      // If the field exists, check if any transaction type is supported
      return (
        features.read.account.transactions.native ||
        features.read.account.transactions.tokens ||
        features.read.account.transactions.staking
      );
    });
  }, [groupedAccounts, chainsDetails]);

  const isLoading =
    isAddressesLoading || isAssetDetailsLoading || isSupportedChainsLoading;

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]"></TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Assets Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <TooltipProvider key={account.address} delayDuration={100}>
                      <TableRow>
                        <TableCell>
                          <div className="relative">
                            <Tooltip
                              text={account.mainAsset?.name || "Unknown"}
                            >
                              <TooltipTrigger>
                                <Avatar className="w-[38px] h-[38px]">
                                  <AvatarImage
                                    src={account.mainAsset?.logo}
                                    alt={account.mainAsset?.name}
                                  />
                                  <AvatarFallback>
                                    {account.mainAsset?.name?.slice(0, 2) ||
                                      "??"}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                            </Tooltip>
                          </div>
                        </TableCell>
                        <TableCell>{account.address}</TableCell>
                        <TableCell>
                          {account.assets.length + (account.mainAsset ? 1 : 0)}
                        </TableCell>
                      </TableRow>
                    </TooltipProvider>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>
                      No accounts found. Please make sure you have connected
                      your wallet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add your transaction history content here */}
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
