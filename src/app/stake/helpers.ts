import { getChainDetailsResponse } from "~/api/chainDetails";
import { MobulaMarketMultiDataResponse } from "~/api/mobula/marketMultiData";
import { MobulaBlockchain } from "~/api/mobula/types";
import { DataAddressStateStaking } from "~/api/staking";
import { amountToMainUnit } from "~/utils/helper";
import { Chain } from "~/utils/types";

type AggregatedBalances = {
  availableBalance: number;
  stakedBalance: number;
  claimableRewards: number;
  unstakingBalance: number;
};

const getBalanceToUSD = (
  amount: string,
  decimals: number,
  mobulaMarketData: MobulaMarketMultiDataResponse | undefined | null,
  chainDetails: Chain
) => {
  const amountInMainUnit = amountToMainUnit(amount, decimals);

  const balanceUSD =
    !chainDetails.isTestNet &&
    mobulaMarketData &&
    mobulaMarketData[chainDetails.ticker]
      ? mobulaMarketData[chainDetails.ticker]?.price *
        parseFloat(amountInMainUnit as string)
      : 0;

  return balanceUSD;
};

export const aggregatedStakingBalances = (
  data: (DataAddressStateStaking | undefined)[],
  chainsDetails: (getChainDetailsResponse | undefined | null)[],
  mobulaMarketData: MobulaMarketMultiDataResponse | undefined | null
) => {
  return data?.reduce<AggregatedBalances>(
    (acc, accountData) => {
      if (!accountData) return { ...acc };

      const chainDetails = chainsDetails.find(
        (chainDetail) => chainDetail?.id === accountData.chainId
      );
      if (!chainDetails) return { ...acc };

      const stakedBalance = getBalanceToUSD(
        accountData?.balances?.staking?.locked,
        chainDetails!.decimals,
        mobulaMarketData,
        chainDetails
      );

      const unstakingBalance = getBalanceToUSD(
        accountData?.balances?.staking?.unlocking,
        chainDetails!.decimals,
        mobulaMarketData,
        chainDetails
      );

      const availableBalance = getBalanceToUSD(
        accountData?.balances?.native.available,
        chainDetails!.decimals,
        mobulaMarketData,
        chainDetails
      );

      const claimableRewards = getBalanceToUSD(
        accountData?.balances?.staking?.unlocked,
        chainDetails!.decimals,
        mobulaMarketData,
        chainDetails
      );

      return {
        ...acc,
        stakedBalance: (acc?.stakedBalance || 0) + stakedBalance,
        unstakingBalance: (acc?.stakedBalance || 0) + unstakingBalance,
        claimableRewards: (acc?.stakedBalance || 0) + claimableRewards,
        availableBalance: (acc?.availableBalance || 0) + availableBalance,
      };
    },
    {
      availableBalance: 0,
      stakedBalance: 0,
      claimableRewards: 0,
      unstakingBalance: 0,
    }
  );
};
