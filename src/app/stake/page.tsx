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

      <StakingPositionsList stakingPositions={stakingPositions} />
    </main>
  );
}
