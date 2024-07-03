"use client";

import { DollarSign, Info, Loader2 } from "lucide-react";
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
import { Tooltip } from "~/components/ui/tooltip";
import { useAddressStateBatch } from "~/hooks/useAddressStateBatch";
import { useGetChainDetailsBatch } from "~/hooks/useGetChainDetailsBatch";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { useWallet } from "~/hooks/useWallet";
import { TransactionProvider } from "~/providers/TransactionProvider";
import { formatAmountUSD } from "~/utils/helper";
import { showroomAddresses } from "../../utils/showroomAddresses";
import { aggregatedStakingBalances } from "../stake/helpers";
import { WalletModalTrigger } from "../wallets/WalletModalTrigger";
import { WalletSigner } from "../wallets/WalletSigner";
import { AssetRow } from "./AssetRow";
import { ConnectWallet } from "./ConnectWallet";
import { Transaction } from "./Transaction";
import {
  calculateAssets,
  getTickers,
  getTokenContractAddresses,
  getTokenTickers,
} from "./helpers";

export default function Portfolio() {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  const { addresses, setWalletMenuOpen: setWalletMenuOpen } = useWallet();

  const displayAddresses = addresses.length > 0 ? addresses : showroomAddresses;
  const chainIdsAdamik = displayAddresses.reduce<string[]>(
    (acc, { chainId }) => {
      if (acc.includes(chainId)) return acc;
      return [...acc, chainId];
    },
    []
  );
  const { data: chainsDetails, isLoading: isChainDetailsLoading } =
    useGetChainDetailsBatch(chainIdsAdamik);
  const { data, isLoading: isAddressesLoading } =
    useAddressStateBatch(displayAddresses);
  const { data: blockchainDetails } = useMobulaBlockchains();

  const mainChainTickersIds = getTickers(chainsDetails || []);
  const tokenTickers = getTokenTickers(data || []);
  const tokenContractAddresses = getTokenContractAddresses(data || []);

  const { data: mobulaMarketData, isLoading: isAssetDetailsLoading } =
    useMobulaMarketMultiData(
      [...mainChainTickersIds, ...tokenTickers],
      !isChainDetailsLoading && !isAddressesLoading,
      "symbols"
    );

  const {
    data: mobulaMarketDataContractAddresses,
    isLoading: isMobulaMarketDataLoading,
  } = useMobulaMarketMultiData(
    tokenContractAddresses,
    !isChainDetailsLoading && !isAddressesLoading,
    "assets"
  );

  const aggregatedBalances = aggregatedStakingBalances(
    data,
    chainsDetails,
    mobulaMarketData
  );

  const [hideLowBalance, setHideLowBalance] = useState(true);
  const [openTransaction, setOpenTransaction] = useState(false);

  const [stepper, setStepper] = useState(0);

  const isLoading =
    isAddressesLoading ||
    isAssetDetailsLoading ||
    isChainDetailsLoading ||
    isMobulaMarketDataLoading;

  const assets = calculateAssets(
    data,
    chainsDetails,
    {
      ...mobulaMarketData,
      ...mobulaMarketDataContractAddresses,
    },
    blockchainDetails
  );

  const filteredAssets = assets
    .filter((asset) => {
      if (asset.balanceUSD === undefined || asset.balanceMainUnit === "0")
        return false;
      return (
        !hideLowBalance || (asset && asset.balanceUSD && asset.balanceUSD > 1)
      );
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      return (b.balanceUSD || 0) - (a.balanceUSD || 0);
    });

  const availableBalance = assets.reduce((acc, asset) => {
    return acc + (asset?.balanceUSD || 0);
  }, 0);

  const totalBalance =
    availableBalance +
    aggregatedBalances.claimableRewards +
    aggregatedBalances.stakedBalance +
    aggregatedBalances.unstakingBalance;

  // Will be remove but useful for debugging because we don't have access to network tabs
  // console.log({
  //   data,
  //   chainsDetails,
  //   assets,
  //   mergedAssets,
  //   mobulaMarketData,
  //   mobulaMarketDataContractAddresses,
  // });
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <TransactionProvider>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Portfolio</h1>
            <Tooltip text="Click to view the API documentation for retrieving balances">
              <a
                href="https://docs.adamik.io/api-reference/endpoint/post-apiaddressstate"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
              </a>
            </Tooltip>
          </div>
          <WalletModalTrigger />
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  formatAmountUSD(totalBalance)
                )}
              </div>
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
                  formatAmountUSD(availableBalance)
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
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  formatAmountUSD(aggregatedBalances.stakedBalance)
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assets</CardTitle>
              <Button
                type="submit"
                onClick={() => {
                  setStepper(0);
                  setOpenTransaction(!openTransaction);
                }}
              >
                Transfer
              </Button>
            </CardHeader>
            <CardContent>
              {!isLoading ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]"></TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Balance
                        </TableHead>
                        <TableHead>Amount (USD)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="overflow-y-auto max-h-[360px]">
                      {filteredAssets.length > 0 &&
                        filteredAssets.map((asset, i) => {
                          if (!asset) return null;
                          return (
                            <AssetRow
                              key={`${i}_${asset.name}`}
                              asset={asset}
                            />
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
                        {`Hide low balance assets (< 1$)`}
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <Loader2 className="animate-spin" />
              )}
            </CardContent>
          </Card>
          <div className="order-first md:order-last">
            {!isLoading ? (
              <Pie
                color={currentTheme === "light" ? "black" : "white"}
                data={{
                  labels: filteredAssets.reduce<string[]>(
                    (acc, asset, index) => {
                      if (index > 9) {
                        const newAcc = [...acc];
                        newAcc[newAcc.length - 1] = "Others";
                        return newAcc;
                      }
                      if (!acc && !asset) return acc;
                      return [...acc, asset?.name as string];
                    },
                    []
                  ),
                  datasets: [
                    {
                      label: "Amount (USD)",
                      data: filteredAssets.reduce<string[]>(
                        (acc, asset, index) => {
                          if (asset?.balanceUSD === undefined) return acc;
                          if (index > 9) {
                            const newAcc = [...acc];
                            newAcc[newAcc.length - 1] = (
                              parseFloat(newAcc[newAcc.length - 1]) +
                              (asset?.balanceUSD || 0)
                            ).toFixed(2);
                            return newAcc;
                          }
                          return [
                            ...acc,
                            asset?.balanceUSD.toFixed(2) as string,
                          ];
                        },
                        []
                      ),
                      borderWidth: 1,
                    },
                  ],
                }}
              />
            ) : (
              <Loader2 className="animate-spin" />
            )}
          </div>
        </div>
        <Modal
          open={openTransaction}
          setOpen={setOpenTransaction}
          modalContent={
            // Probably need to rework
            stepper === 0 ? (
              <Transaction
                assets={filteredAssets}
                onNextStep={() => {
                  setStepper(1);
                }}
              />
            ) : (
              <>
                {addresses && addresses.length > 0 ? (
                  <WalletSigner
                    onNextStep={() => {
                      setOpenTransaction(false);
                      setTimeout(() => {
                        setStepper(0);
                      }, 200);
                    }}
                  />
                ) : (
                  <ConnectWallet
                    onNextStep={() => {
                      setOpenTransaction(false);
                      setWalletMenuOpen(true);
                      setTimeout(() => {
                        setStepper(0);
                      }, 200);
                    }}
                  />
                )}
              </>
            )
          }
        />
      </TransactionProvider>
    </main>
  );
}
