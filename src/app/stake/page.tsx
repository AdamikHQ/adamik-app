"use client";

import { Button } from "~/components/ui/button";
import { WalletModalTrigger } from "../wallets/WalletModalTrigger";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Info } from "lucide-react";
import { Tooltip } from "~/components/ui/tooltip";
import { useAddressStateBatchStakingBatch } from "~/hooks/useAddressStateStakingBatch";
import { aggregatedStakingBalances } from "./helpers";
import { useGetChainDetailsBatch } from "~/hooks/useGetChainDetailsBatch";
import { showroomAddresses } from "./showroomAddresses";
import { useWallet } from "~/hooks/useWallet";
import { getTickers } from "../portfolio/helpers";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { formatAmountUSD } from "~/utils/helper";

export default function Stake() {
  const { data } = useAddressStateBatchStakingBatch();
  const { addresses } = useWallet();

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

  const mainChainTickersIds = getTickers(chainsDetails || []);
  const { data: mobulaMarketData, isLoading: isAssetDetailsLoading } =
    useMobulaMarketMultiData(
      [...mainChainTickersIds],
      !isChainDetailsLoading,
      "symbols"
    );
  const aggregatedBalances = aggregatedStakingBalances(
    data,
    chainsDetails,
    mobulaMarketData
  );

  console.log({ data, aggregatedBalances });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Staking Portal</h1>
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

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmountUSD(aggregatedBalances.availableBalance)}
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
              {formatAmountUSD(aggregatedBalances.stakedBalance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Claimable Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmountUSD(aggregatedBalances.claimableRewards)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unstaking Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmountUSD(aggregatedBalances.unstakingBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
        <Button className="col-span-2">Stake</Button>
        <Button>Unstake</Button>

        <Button>Claim</Button>
      </div>

      <div>
        <Card className="lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden md:table-cell"></TableHead>
                <TableHead>Validator</TableHead>
                <TableHead>Amount stake</TableHead>
                <TableHead>Amount (USD)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Claimable rewards</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody></TableBody>
          </Table>
        </Card>
      </div>
    </main>
  );
}
