"use client";

import { DollarSign, Loader2 } from "lucide-react";
import { useState } from "react";
import { Pie } from "react-chartjs-2";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Modal } from "~/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useCoinGeckoSimplePrice } from "~/hooks/useCoinGeckoSimplePrice";
import { useGetAddressDataBatch } from "~/hooks/useGetAddressDataBatch";
import { useGetChainDetailsBatch } from "~/hooks/useGetChainDetailsBatch";
import { useGetMobulaMarketMultiDataBatch } from "~/hooks/useGetMobulaMarketMultiData";
import { CoinIdMapperAdamikToCoinGecko, amountToMainUnit } from "~/lib/utils";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transaction } from "./Transaction";
import { TransactionLoading } from "./TransactionLoading";
import { showroomAddresses } from "./showroomAddresses";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useMobulaMarketMultiDataTickers } from "~/hooks/useGetMobulaMarketMultiDataTicker";

export default function Portfolio() {
  const chainIds = showroomAddresses.reduce<string[]>((acc, { chainId }) => {
    if (acc.includes(chainId)) return acc;
    return [...acc, CoinIdMapperAdamikToCoinGecko(chainId)];
  }, []);
  const mainChainTickersIds = showroomAddresses.reduce<string[]>(
    (acc, { ticker }) => {
      if (acc.includes(ticker)) return acc;
      return [...acc, ticker];
    },
    []
  );
  const chainIdsAdamik = showroomAddresses.reduce<string[]>(
    (acc, { chainId }) => {
      if (acc.includes(chainId)) return acc;
      return [...acc, chainId];
    },
    []
  );
  const {
    data: simplePriceMainChain,
    isLoading: isSimplePriceMainChainLoading,
  } = useMobulaMarketMultiDataTickers(mainChainTickersIds);
  const { data: chainsDetails, isLoading: isChainDetailsLoading } =
    useGetChainDetailsBatch(chainIdsAdamik);
  const { data, isLoading: isAddressesLoading } =
    useGetAddressDataBatch(showroomAddresses);
  const tokenTickers = data.reduce((acc, accountData) => {
    if (!accountData) return acc;
    const chainTokenIds = [
      ...(accountData.balances.tokens
        ?.map((token) => token.token.ticker)
        .filter(Boolean) || []),
    ];
    if (!acc[accountData.chainId]) {
      return {
        ...acc,
        [accountData.chainId]: chainTokenIds,
      };
    }
    return {
      ...acc,
      [accountData.chainId]: [...acc[accountData.chainId], ...chainTokenIds],
    };
  }, {} as Record<string, string[]>);

  const { data: tokenPrices, isLoading: isTokenPriceLoading } =
    useGetMobulaMarketMultiDataBatch(tokenTickers);

  const [hideLowBalance, setHideLowBalance] = useState(true);
  const [openTransaction, setOpenTransaction] = useState(false);

  const [stepper, setStepper] = useState(0);

  const isLoading =
    isAddressesLoading ||
    isSimplePriceMainChainLoading ||
    isChainDetailsLoading ||
    isTokenPriceLoading;

  if (isLoading) {
    return (
      <Loading
        isAddressesLoading={isAddressesLoading}
        isSimplePriceLoading={isSimplePriceMainChainLoading}
        isChainDetailsLoading={isChainDetailsLoading}
        isTokenPriceLoading={isTokenPriceLoading}
      />
    );
  }

  const assets = data
    .map((accountData) => {
      if (!accountData) {
        return null;
      }
      const chainDetails = chainsDetails.find(
        (chainDetail) => chainDetail?.id === accountData.chainId
      );

      if (!chainDetails) {
        return null;
      }

      const balanceMainUnit = amountToMainUnit(
        accountData.balances.native.available,
        chainDetails!.decimals
      );

      const balanceUSD =
        simplePriceMainChain![chainDetails.ticker]?.price *
        parseFloat(balanceMainUnit as string); // maybe we need us of bignumber here ?

      return {
        logo: simplePriceMainChain![chainDetails.ticker]?.logo,
        chainId: accountData.chainId,
        name: chainDetails?.name,
        balanceMainUnit,
        balanceUSD,
        ticker: chainDetails?.ticker,
      };
    })
    .filter(Boolean);

  const assetTokens = data.reduce((acc, accountData) => {
    if (!accountData) return acc;

    const tokensList = accountData.balances.tokens
      ? accountData.balances.tokens.reduce((tokenAcc, tokenAccountData) => {
          if (!tokenAccountData) return tokenAcc;

          const balanceMainUnit = amountToMainUnit(
            tokenAccountData.value,
            tokenAccountData.token.decimals
          );

          const chainIndex = tokenPrices.findIndex(
            (tokenPrice) =>
              tokenPrice?.chainId === tokenAccountData.token.chainId
          );
          const balanceUSD =
            tokenPrices[chainIndex]?.data[tokenAccountData.token.ticker] &&
            tokenPrices[chainIndex]?.data[tokenAccountData.token.ticker].price
              ? (tokenPrices[chainIndex]?.data[tokenAccountData.token.ticker]
                  ?.price || 0) * parseFloat(balanceMainUnit as string)
              : undefined;
          return [
            ...tokenAcc,
            {
              logo:
                tokenPrices[chainIndex]?.data[tokenAccountData.token.ticker]
                  ?.logo || "",
              assetId: tokenAccountData.token.id,
              chainId: tokenAccountData.token.chainId,
              name: tokenAccountData.token.name,
              balanceMainUnit: balanceMainUnit,
              balanceUSD: balanceUSD,
              ticker: tokenAccountData.token.ticker,
            },
          ];
        }, [] as any[])
      : [];

    return [...acc, ...tokensList];
  }, [] as any[]);

  const mergedAssets = [
    ...Object.values(
      assets.reduce((acc, asset) => {
        if (!asset) return acc;
        if (acc[asset.chainId]) {
          acc[asset.chainId].balanceUSD += asset.balanceUSD;
        } else {
          acc[asset.chainId] = { ...asset, subAssets: [{ ...asset }] };
        }
        return acc;
      }, {} as { [key: string]: any })
    ),
    ...assetTokens,
  ]
    .filter((asset) => !hideLowBalance || (asset && asset.balanceUSD > 0.1))
    .sort((a, b) => {
      if (!a || !b) return 0;
      return (b.balanceUSD || -0.01) - (a.balanceUSD || -0.01);
    });

  // Will be remove but useful for debugging because we don't have access to network tabs
  console.log({
    data,
    chainsDetails,
    assets,
    mergedAssets,
    tokenPrices,
    assetTokens,
    simplePriceMainChain,
  });
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Portfolio</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">WIP</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                mergedAssets
                  .reduce((acc, asset) => {
                    return acc + (asset?.balanceUSD || 0);
                  }, 0)
                  .toFixed(2)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Staked Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">WIP</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Assets</CardTitle>
            {/* <Button
              type="submit"
              onClick={() => setOpenTransaction(!openTransaction)}
            >
              Transfer
            </Button> */}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden md:table-cell"></TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Balance
                  </TableHead>
                  <TableHead>Amount (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="overflow-y-auto max-h-[360px]">
                {mergedAssets.length > 0 &&
                  mergedAssets.map((asset, i) => {
                    return (
                      <TableRow key={`${asset?.chainId}_${i}`}>
                        <TableCell className="hidden md:block">
                          <div className="font-medium">
                            {asset?.logo && (
                              <Avatar>
                                <AvatarImage
                                  src={asset?.logo}
                                  alt={asset.name}
                                />
                                <AvatarFallback>{asset.name}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{asset?.ticker}</div>
                        </TableCell>
                        <TableCell className="hidden md:block">
                          {asset?.balanceMainUnit} {asset?.ticker}
                        </TableCell>
                        <TableCell>
                          {asset?.balanceUSD?.toFixed(2) || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
            <div className="items-top flex space-x-2">
              <Checkbox
                id="hideBalance"
                checked={hideLowBalance}
                onClick={() => {
                  setHideLowBalance(!hideLowBalance);
                }}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="hideBalance"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {`Hide low balance assets (< 0.1$)`}
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-8">
          <Pie
            data={{
              labels: mergedAssets.reduce<string[]>((acc, asset, index) => {
                if (index > 9) {
                  const newAcc = [...acc];
                  newAcc[newAcc.length - 1] = "Others";
                  return newAcc;
                }
                if (!acc && !asset) return acc;
                return [...acc, asset?.name as string];
              }, []),
              datasets: [
                {
                  label: "Amount (USD)",
                  data: mergedAssets.reduce<string[]>((acc, asset, index) => {
                    if (asset?.balanceUSD === undefined) return acc;
                    if (index > 9) {
                      const newAcc = [...acc];
                      newAcc[newAcc.length - 1] = (
                        parseFloat(newAcc[newAcc.length - 1]) +
                        (asset?.balanceUSD || 0)
                      ).toFixed(2);
                      return newAcc;
                    }
                    return [...acc, asset?.balanceUSD.toFixed(2) as string];
                  }, []),
                  borderWidth: 1,
                },
              ],
            }}
          />
        </div>
      </div>
      <Modal
        open={openTransaction}
        setOpen={setOpenTransaction}
        modalTitle="Create a Transaction"
        modalContent={
          // Probably need to rework
          stepper === 0 ? (
            <Transaction
              onNextStep={() => {
                setStepper(1);
              }}
            />
          ) : stepper === 1 ? (
            <TransactionLoading
              onNextStep={() => {
                setStepper(2);
              }}
            />
          ) : (
            <ConnectWallet />
          )
        }
      />
    </main>
  );
}
