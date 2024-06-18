"use client";

import { DollarSign, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Pie } from "react-chartjs-2";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Modal } from "~/components/ui/modal";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useGetChainDetailsBatch } from "~/hooks/useGetChainDetailsBatch";
import { useMobulaMarketMultiDataTickers } from "~/hooks/useGetMobulaMarketMultiDataTicker";
import { AssetRow } from "./AssetRow";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transaction } from "./Transaction";
import { TransactionLoading } from "./TransactionLoading";
import {
  calculateAssets,
  getTickers,
  getTokenTickers,
  mergedAssetsById,
} from "./helpers";
import { showroomAddresses } from "./showroomAddresses";
import { useAddressStateBatch } from "~/hooks/useAddressStateBatch";

export default function Portfolio() {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const chainIdsAdamik = showroomAddresses.reduce<string[]>(
    (acc, { chainId }) => {
      if (acc.includes(chainId)) return acc;
      return [...acc, chainId];
    },
    []
  );
  const { data: chainsDetails, isLoading: isChainDetailsLoading } =
    useGetChainDetailsBatch(chainIdsAdamik);
  const { data, isLoading: isAddressesLoading } =
    useAddressStateBatch(showroomAddresses);

  const mainChainTickersIds = getTickers(chainsDetails || []);
  const tokenTickers = getTokenTickers(data || []);

  const { data: mobulaMarketData, isLoading: isAssetDetailsLoading } =
    useMobulaMarketMultiDataTickers(
      [...mainChainTickersIds, ...tokenTickers],
      !isChainDetailsLoading && !isAddressesLoading
    );

  const [hideLowBalance, setHideLowBalance] = useState(true);
  const [openTransaction, setOpenTransaction] = useState(false);

  const [stepper, setStepper] = useState(0);

  const isLoading =
    isAddressesLoading || isAssetDetailsLoading || isChainDetailsLoading;

  if (isLoading) {
    return (
      <Loading
        isAddressesLoading={isAddressesLoading}
        isAssetDetailsLoading={isAssetDetailsLoading}
        isChainDetailsLoading={isChainDetailsLoading}
      />
    );
  }

  const assets = calculateAssets(data, chainsDetails, mobulaMarketData);

  const mergedAssets = mergedAssetsById(assets)
    .filter(
      (asset) =>
        !hideLowBalance || (asset && asset.balanceUSD && asset.balanceUSD > 0.1)
    )
    .sort((a, b) => {
      if (!a || !b) return 0;
      return (b.balanceUSD || 0) - (a.balanceUSD || 0);
    });

  // Will be remove but useful for debugging because we don't have access to network tabs
  console.log({
    data,
    chainsDetails,
    assets,
    mergedAssets,
    mobulaMarketData,
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
            <Button
              type="submit"
              onClick={() => setOpenTransaction(!openTransaction)}
            >
              Transfer
            </Button>
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
                    if (!asset) return null;
                    return <AssetRow key={i} asset={asset} />;
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
        <div className="order-first md:order-last">
          <Pie
            color={currentTheme === "light" ? "black" : "white"}
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
