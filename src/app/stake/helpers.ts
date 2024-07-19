import { GetAddressStateResponse } from "~/api/addressState";
import { GetChainDetailsResponse } from "~/api/chainDetails";
import { MobulaMarketMultiDataResponse } from "~/api/mobula/marketMultiData";
import { ValidatorResponse } from "~/api/validator";
import { amountToMainUnit, resolveLogo } from "~/utils/helper";
import { Chain, Validator } from "~/utils/types";

export type AggregatedBalances = {
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
    // !chainDetails.isTestNet &&  TMP: Just to usetestnet for test
    mobulaMarketData && mobulaMarketData[chainDetails.ticker]
      ? mobulaMarketData[chainDetails.ticker]?.price *
        parseFloat(amountInMainUnit as string)
      : 0;

  return balanceUSD;
};

export const aggregateStakingBalances = (
  data: (GetAddressStateResponse | undefined | null)[],
  chainsDetails: (GetChainDetailsResponse | undefined | null)[],
  mobulaMarketData: MobulaMarketMultiDataResponse | undefined | null
): AggregatedBalances => {
  return data?.reduce<AggregatedBalances>(
    (acc, accountData) => {
      if (!accountData) return { ...acc };

      const chainDetails = chainsDetails.find(
        (chainDetail) => chainDetail?.id === accountData.chainId
      );
      if (!chainDetails) return { ...acc };

      const stakedBalance = getAmountToUSD(
        accountData?.balances?.staking?.locked || "0",
        chainDetails!.decimals,
        mobulaMarketData,
        chainDetails
      );

      const unstakingBalance = getAmountToUSD(
        accountData?.balances?.staking?.unlocking || "0",
        chainDetails!.decimals,
        mobulaMarketData,
        chainDetails
      );

      const availableBalance = getAmountToUSD(
        accountData?.balances?.native.available || "0",
        chainDetails!.decimals,
        mobulaMarketData,
        chainDetails
      );

      const claimableRewards = getAmountToUSD(
        accountData?.balances?.staking?.rewards?.native
          .reduce((acc, reward) => acc + Number(reward.amount), 0)
          .toString() || "0", // TODO: Remove this after fixing the API
        chainDetails!.decimals,
        mobulaMarketData,
        chainDetails
      );

      return {
        ...acc,
        stakedBalance: (acc?.stakedBalance || 0) + stakedBalance,
        unstakingBalance: (acc?.unstakingBalance || 0) + unstakingBalance,
        claimableRewards: (acc?.claimableRewards || 0) + claimableRewards,
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

export type StakingPosition = {
  chainId: string;
  chainName: string;
  chainLogo?: string;
  addresses: string[];
  validatorName?: string;
  validatorAddresses: string[];
  amount: string;
  amountUSD?: number;
  status: string;
  completionDate?: number;
  rewardAmount?: string;
  rewardAmountUSD?: number;
  commission?: number;
  ticker: string;
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

export const getAddressStakingPositions = (
  data: (GetAddressStateResponse | null | undefined)[],
  chainsDetails: (GetChainDetailsResponse | undefined | null)[],
  mobulaMarketData: MobulaMarketMultiDataResponse | undefined | null,
  validatorsData: (ValidatorResponse | undefined)[]
) => {
  const positions = data.reduce<Record<string, StakingPosition>>(
    (acc, accountData) => {
      const newAcc = { ...acc };
      if (!accountData) return { ...acc };

      const chainDetails = chainsDetails.find(
        (chainDetail) => chainDetail?.id === accountData.chainId
      );
      if (!chainDetails) return { ...acc };

      (accountData?.balances.staking?.positions || []).forEach((position) => {
        position.validatorAddresses.forEach((validatorAddress) => {
          const validatorInfo = getValidatorInfo(
            validatorsData,
            validatorAddress
          );
          const currentAddresses = newAcc[validatorAddress]?.addresses || [];
          newAcc[validatorAddress] = {
            ...position,
            addresses: [accountData.address].concat(currentAddresses),
            validatorName: validatorInfo?.name,
            commission: Number(validatorInfo?.commission),
            chainId: accountData.chainId,
            chainLogo: resolveLogo({
              asset: { name: chainDetails.name, ticker: chainDetails.ticker },
              mobulaMarketData,
            }),
            chainName: chainDetails.name,
            ticker: chainDetails.ticker,
            amount:
              amountToMainUnit(position.amount, chainDetails.decimals) || "-",
            amountUSD: getAmountToUSD(
              position.amount,
              chainDetails.decimals,
              mobulaMarketData,
              chainDetails
            ),
          };
        });
      });

      (accountData?.balances.staking?.rewards.native || []).forEach(
        (reward) => {
          newAcc[reward.validatorAddress] = {
            ...(newAcc[reward.validatorAddress] || {}),
            rewardAmount:
              amountToMainUnit(reward.amount, chainDetails.decimals) || "-",
            rewardAmountUSD: getAmountToUSD(
              reward.amount,
              chainDetails.decimals,
              mobulaMarketData,
              chainDetails
            ),
          };
        }
      );

      return newAcc;
    },
    {}
  );

  return positions;
};

export const createValidatorList = (
  validatorData: (ValidatorResponse | undefined)[],
  chainsDetails: (GetChainDetailsResponse | undefined | null)[],
  mobulaMarketData: MobulaMarketMultiDataResponse | undefined | null
): Validator[] => {
  return validatorData
    .reduce<Validator[]>((acc, current) => {
      const chainDetails = chainsDetails.find(
        (chainDetails) => chainDetails?.id === current?.chainId
      );
      if (!chainDetails) return acc;

      const chainValidators = current?.validators.reduce<Validator[]>(
        (subAcc, validator) => {
          const stakedAmount = validator.stakedAmount || "0";

          return [
            ...subAcc,
            {
              ...validator,
              commission: Number(validator.commission),
              chainId: current.chainId,
              chainName: chainDetails.name,
              chainLogo: resolveLogo({
                asset: { name: chainDetails.name, ticker: chainDetails.ticker },
                mobulaMarketData,
              }),
              decimals: chainDetails.decimals,
              ticker: chainDetails.ticker,
              stakedAmount: Number(stakedAmount),
            },
          ];
        },
        []
      );

      if (!chainValidators) return acc;

      return [...acc, ...chainValidators];
    }, [])
    .sort((a, b) => b.stakedAmount - a.stakedAmount);
};
