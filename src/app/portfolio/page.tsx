"use client";

import { DollarSign, Loader2 } from "lucide-react";
import { Pie } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import { CoinIdMapperAdamikToCoinGecko, amountToMainUnit } from "~/lib/utils";
import { Loading } from "./Loading";
import { useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Modal } from "~/components/ui/modal";
import { Button } from "~/components/ui/button";
import { showroomAddresses } from "./showroomAddresses";

export default function Portfolio() {
  const chainIds = showroomAddresses.reduce<string[]>((acc, { chainId }) => {
    if (acc.includes(chainId)) return acc;
    return [...acc, CoinIdMapperAdamikToCoinGecko(chainId)];
  }, []);
  const chainIdsAdamik = showroomAddresses.reduce<string[]>(
    (acc, { chainId }) => {
      if (acc.includes(chainId)) return acc;
      return [...acc, chainId];
    },
    []
  );
  const { data: simplePrice, isLoading: isSimplePriceLoading } =
    useCoinGeckoSimplePrice(chainIds);
  const { data: chainsDetails, isLoading: isChainDetailsLoading } =
    useGetChainDetailsBatch(chainIdsAdamik);
  const { data, isLoading: isAddressesLoading } =
    useGetAddressDataBatch(showroomAddresses);
  const [hideLowBalance, setHideLowBalance] = useState(true);
  const [openTransaction, setOpenTransaction] = useState(false);

  const isLoading =
    isAddressesLoading || isSimplePriceLoading || isChainDetailsLoading;

  if (isLoading) {
    return (
      <Loading
        isAddressesLoading={isAddressesLoading}
        isSimplePriceLoading={isSimplePriceLoading}
        isChainDetailsLoading={isChainDetailsLoading}
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

      const balanceMainUnit = amountToMainUnit(
        accountData.balances.native.available,
        chainDetails!.decimals
      );

      const balanceUSD =
        simplePrice![CoinIdMapperAdamikToCoinGecko(accountData.chainId)]?.usd *
        parseFloat(balanceMainUnit as string); // maybe we need us of bignumber here ?

      return {
        chainId: accountData.chainId,
        name: chainDetails?.name,
        balanceMainUnit,
        balanceUSD,
        ticker: chainDetails?.ticker,
      };
    })
    .filter((asset) => !hideLowBalance || (asset && asset.balanceUSD > 0))
    .sort((a, b) => {
      if (!a || !b) return 0;
      return b.balanceUSD - a.balanceUSD;
    });

  // Will be remove but useful for debugging because we don't have access to network tabs
  // console.log({ data, simplePrice, chainsDetails, assets });
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Portfolio</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card x-chunk="dashboard-01-chunk-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                assets
                  .reduce((acc, asset) => {
                    return acc + (asset?.balanceUSD || 0);
                  }, 0)
                  .toFixed(2)
              )}
            </div>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-1">
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
                assets
                  .reduce((acc, asset) => {
                    return acc + (asset?.balanceUSD || 0);
                  }, 0)
                  .toFixed(2)
              )}
            </div>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
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
            <Button
              type="submit"
              onClick={() => setOpenTransaction(!openTransaction)}
            >
              Transfer
            </Button>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden md:block"></TableHead>
                  <TableHead>Asset Name</TableHead>
                  <TableHead className="hidden md:block">Balance</TableHead>
                  <TableHead>Amount (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.length > 0 &&
                  assets.map((asset, i) => {
                    return (
                      <TableRow key={`${asset?.chainId}_${i}`}>
                        <TableCell className="hidden md:block">
                          <div className="font-medium"></div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{asset?.name}</div>
                        </TableCell>
                        <TableCell className="hidden md:block">
                          {asset?.balanceMainUnit} {asset?.ticker}
                        </TableCell>
                        <TableCell>{asset?.balanceUSD.toFixed(2)}</TableCell>
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
                  {`Hide low balance assets (< 1%)`}
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-8">
          <Pie
            data={{
              labels: assets.reduce<string[]>((acc, asset) => {
                if (!acc && !asset) return acc;
                return [...acc, asset?.name as string];
              }, []),
              datasets: [
                {
                  label: "Amount (USD)",
                  data: assets.reduce<string[]>((acc, asset) => {
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
        modalContent={<>WIP</>}
      />
    </main>
  );
}
