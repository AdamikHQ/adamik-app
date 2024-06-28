import { getChainDetailsResponse } from "~/api/chainDetails";
import { MobulaMarketMultiDataResponse } from "~/api/mobula/marketMultiData";
import { MobulaBlockchain } from "~/api/mobula/types";
import { DataAddressStateStaking } from "~/api/staking";
import { ValidatorResponse } from "~/api/validator";
import { amountToMainUnit } from "~/utils/helper";
import { Chain } from "~/utils/types";

type AggregatedBalances = {
  availableBalance: number;
  stakedBalance: number;
  claimableRewards: number;
  unstakingBalance: number;
};

const getAmountToUSD = (
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

      const stakedBalance = getAmountToUSD(
        accountData?.balances?.staking?.locked,
        chainDetails!.decimals,
        mobulaMarketData,
        chainDetails
      );

      const unstakingBalance = getAmountToUSD(
        accountData?.balances?.staking?.unlocking,
        chainDetails!.decimals,
        mobulaMarketData,
        chainDetails
      );

      const availableBalance = getAmountToUSD(
        accountData?.balances?.native.available,
        chainDetails!.decimals,
        mobulaMarketData,
        chainDetails
      );

      const claimableRewards = getAmountToUSD(
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

export type Validator = {
  chainId: string;
  chainLogo?: string;
  validatorAddresses: string[];
  amount: string;
  amountUSD?: number;
  status: string;
  completionDate?: number;
  rewardAmount?: string;
  rewardAmountUSD?: number;
  name?: string;
  commission?: number;
};

const getValidatorInfo = (
  validatorsData: (ValidatorResponse | undefined)[],
  validatorAddress: string
) => {
  let validator = null;

  for (const validatorsChainId of validatorsData) {
    for (const validatorData of validatorsChainId?.validators || []) {
      if (validatorData?.address === validatorAddress) {
        validator = validatorData;
        break;
      }
    }
    if (validator) break;
  }

  return validator;
};

export const getAddressValidators = (
  data: (DataAddressStateStaking | undefined)[],
  chainsDetails: (getChainDetailsResponse | undefined | null)[],
  mobulaMarketData: MobulaMarketMultiDataResponse | undefined | null,
  validatorsData: (ValidatorResponse | undefined)[]
) => {
  console.log({ validatorsData });
  const validators = data.reduce<Record<string, Validator>>(
    (acc, accountData) => {
      const newAcc = { ...acc };
      if (!accountData) return { ...acc };

      const chainDetails = chainsDetails.find(
        (chainDetail) => chainDetail?.id === accountData.chainId
      );
      if (!chainDetails) return { ...acc };

      accountData?.balances.staking.positions.forEach((position) => {
        position.validatorAddresses.forEach((validatorAddress) => {
          const validatorInfo = getValidatorInfo(
            validatorsData,
            validatorAddress
          );
          newAcc[validatorAddress] = {
            ...position,
            name: validatorInfo?.name,
            commission: validatorInfo?.commission,
            chainId: accountData.chainId,
            chainLogo: mobulaMarketData?.[chainDetails.ticker]?.logo,
            amountUSD: getAmountToUSD(
              position.amount,
              chainDetails.decimals,
              mobulaMarketData,
              chainDetails
            ),
          };
        });
      });

      accountData?.balances.staking.rewards.native.forEach((reward) => {
        newAcc[reward.validatorAddress] = {
          ...(newAcc[reward.validatorAddress] || {}),
          rewardAmount: reward.amount,
          rewardAmountUSD: getAmountToUSD(
            reward.amount,
            chainDetails.decimals,
            mobulaMarketData,
            chainDetails
          ),
        };
      });

      return newAcc;
    },
    {}
  );

  return validators;
};
