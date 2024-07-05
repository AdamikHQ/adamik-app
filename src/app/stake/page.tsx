"use client";

import { Info } from "lucide-react";
import { LoadingModal } from "~/components/layout/LoadingModal";
import { ShowroomBanner } from "~/components/layout/ShowroomBanner";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import {
  isAddressStateCache,
  useAddressStateBatch,
} from "~/hooks/useAddressStateBatch";
import { useGetChainDetailsBatch } from "~/hooks/useGetChainDetailsBatch";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { useValidatorsBatch } from "~/hooks/useValidatorsBatch";
import { useWallet } from "~/hooks/useWallet";
import { showroomAddresses } from "../../utils/showroomAddresses";
import { getTickers } from "../portfolio/helpers";
import { WalletModalTrigger } from "../wallets/WalletModalTrigger";
import { StakingBalances } from "./StakingBalances";
import {
  aggregateStakingBalances,
  getAddressStakingPositions,
} from "./helpers";
import { StakingPositionsList } from "./StakingPositionsList";

export default function Stake() {
  const { addresses, isShowroom } = useWallet();

  const displayAddresses = isShowroom ? showroomAddresses : addresses;
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

  const aggregatedBalances = aggregateStakingBalances(
    data,
    chainsDetails,
    mobulaMarketData
  );

  const stakingPositions = getAddressStakingPositions(
    data,
    chainsDetails,
    mobulaMarketData,
    validatorsData
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      {isLoading && !isAddressStateCache(displayAddresses) ? (
        <LoadingModal />
      ) : null}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Staking Portal</h1>
          <Tooltip text="View the API documentation for retrieving staking data">
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

      {isShowroom ? <ShowroomBanner /> : null}

      <StakingBalances aggregatedBalances={aggregatedBalances} />

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
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <CardTitle>Validators</CardTitle>
              <Tooltip text="View the API documentation for retrieving validators">
                <a
                  href="https://docs.adamik.io/api-reference/endpoint/post-apichains-chainid-validators"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
                </a>
              </Tooltip>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] md:table-cell"></TableHead>
                <TableHead>Validator</TableHead>
                <TableHead>Amount staked</TableHead>
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
      <StakingPositionsList stakingPositions={stakingPositions} />
    </main>
  );
}
