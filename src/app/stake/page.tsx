"use client";

import { Info } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tooltip } from "~/components/ui/tooltip";
import { useAddressStateBatch } from "~/hooks/useAddressStateBatch";
import { useGetChainDetailsBatch } from "~/hooks/useGetChainDetailsBatch";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { useValidatorsBatch } from "~/hooks/useValidatorsBatch";
import { useWallet } from "~/hooks/useWallet";
import { formatAmountUSD } from "~/utils/helper";
import { getTickers } from "../portfolio/helpers";
import { WalletModalTrigger } from "../wallets/WalletModalTrigger";
import { ValidatorRow } from "./ValidatorRow";
import { aggregatedStakingBalances, getAddressValidators } from "./helpers";
import { showroomAddresses } from "../../utils/showroomAddresses";
import { LoadingModal } from "~/components/layout/LoadingModal";

export default function Stake() {
  const { addresses } = useWallet();

  const displayAddresses = addresses.length > 0 ? addresses : showroomAddresses;
  const chainIdsAdamik = displayAddresses.reduce<string[]>(
    (acc, { chainId }) => {
      if (acc.includes(chainId)) return acc;
      return [...acc, chainId];
    },
    []
  );
  const { data, isLoading: isAddressStateLoading } =
    useAddressStateBatch(displayAddresses);
  const { data: chainsDetails, isLoading: isChainDetailsLoading } =
    useGetChainDetailsBatch(chainIdsAdamik);

  const mainChainTickersIds = getTickers(chainsDetails || []);
  const { data: mobulaMarketData } = useMobulaMarketMultiData(
    [...mainChainTickersIds],
    !isChainDetailsLoading,
    "symbols"
  );

  const { data: validatorsData, isLoading: validatorLoading } =
    useValidatorsBatch(chainIdsAdamik);

  const isLoading =
    validatorLoading || isChainDetailsLoading || isAddressStateLoading;

  const aggregatedBalances = aggregatedStakingBalances(
    data,
    chainsDetails,
    mobulaMarketData
  );

  const validators = getAddressValidators(
    data,
    chainsDetails,
    mobulaMarketData,
    validatorsData
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      {isLoading ? <LoadingModal /> : null}
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
        <Tooltip text="Coming Soon">
          <Button className="opacity-50 cursor-default">Unstake</Button>
        </Tooltip>

        <Tooltip text="Coming Soon">
          <Button className="opacity-50 cursor-default">Claim</Button>
        </Tooltip>
      </div>

      <div>
        <Card className="lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] md:table-cell"></TableHead>
                <TableHead>Validator</TableHead>
                <TableHead>Amount stake</TableHead>
                <TableHead>Amount (USD)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Claimable rewards</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(validators).length > 0 ? (
                Object.entries(validators)
                  .sort((a, b) => {
                    return (b[1].amountUSD || 0) - (a[1].amountUSD || 0);
                  })
                  .map(([validatorAddress, validator]) => (
                    <ValidatorRow
                      key={validatorAddress}
                      validator={validator}
                      validatorAddress={validatorAddress}
                    />
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No validator found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </main>
  );
}
