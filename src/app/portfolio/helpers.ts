import { GetAddressStateResponse } from "~/api/addressState";
import { getChainDetailsResponse } from "~/api/chainDetails";
import { Asset } from "~/utils/types";
import { amountToMainUnit } from "~/utils/helper";
import { MobulaMarketMultiDataResponse } from "~/api/mobula/marketMultiData";

export const getTickers = (
  data: (getChainDetailsResponse | undefined | null)[]
) => {
  return data.reduce<string[]>((acc, chainDetail) => {
    if (!chainDetail) return acc;
    return [...acc, chainDetail.ticker];
  }, []);
};

export const getTokenTickers = (
  data: (GetAddressStateResponse | undefined | null)[]
) => {
  return data.reduce<string[]>((acc, accountData) => {
    if (!accountData) return acc;

    const chainTokenIds = [
      ...((accountData.balances.tokens
        ?.map((token) =>
          token.token.contractAddress ? undefined : token.token.ticker
        )
        .filter(Boolean) || []) as string[]),
    ];
    return Array.from(new Set([...acc, ...chainTokenIds])); // remove duplicates
  }, []);
};

export const getTokenContractAddresses = (
  data: (GetAddressStateResponse | undefined | null)[]
) => {
  return data.reduce<string[]>((acc, accountData) => {
    if (!accountData) return acc;

    const chainTokenIds = [
      ...(accountData.balances.tokens
        ?.filter((token) => token.token.contractAddress)
        .map((token) => token.token.contractAddress as string) || []),
    ];
    return Array.from(new Set([...acc, ...chainTokenIds])); // remove duplicates
  }, []);
};

export const getTokenTickersSortByChain = (
  data: (GetAddressStateResponse | undefined | null)[]
) => {
  return data.reduce((acc, accountData) => {
    if (!accountData) return acc;
    const chainTokenIds = [
      ...(accountData.balances.tokens
        ?.map((token) => token.token.ticker)
        .filter(Boolean) || []),
    ];
    if (!acc[accountData.chainId]) {
      return {
        ...acc,
        [accountData.chainId]: chainTokenIds,
      };
    }
    return {
      ...acc,
      [accountData.chainId]: [...acc[accountData.chainId], ...chainTokenIds],
    };
  }, {} as Record<string, string[]>);
};

export const calculateAssets = (
  data: (GetAddressStateResponse | undefined | null)[],
  chainsDetails: (getChainDetailsResponse | undefined | null)[],
  mobulaMarketData: MobulaMarketMultiDataResponse | undefined | null
): Asset[] => {
  return data.reduce<Asset[]>((acc, accountData) => {
    if (!accountData) return [...acc];

    const chainDetails = chainsDetails.find(
      (chainDetail) => chainDetail?.id === accountData.chainId
    );

    if (!chainDetails) {
      return [...acc];
    }
    const balanceMainUnit = amountToMainUnit(
      accountData.balances.native.available,
      chainDetails!.decimals
    );

    const balanceUSD =
      mobulaMarketData && mobulaMarketData[chainDetails.ticker]
        ? mobulaMarketData[chainDetails.ticker]?.price *
          parseFloat(balanceMainUnit as string)
        : undefined;

    const mainChainAsset = {
      logo:
        mobulaMarketData && mobulaMarketData[chainDetails.ticker]
          ? mobulaMarketData?.[chainDetails.ticker].logo
          : "",
      chainId: accountData.chainId,
      name: chainDetails?.name,
      balanceMainUnit,
      balanceUSD,
      ticker: chainDetails?.ticker,
      address: accountData.address,
    };

    const tokenAssets =
      accountData.balances.tokens?.reduce<Asset[]>(
        (tokenAcc, tokenAccountData) => {
          if (!tokenAccountData) return tokenAcc;

          const balanceMainUnit = amountToMainUnit(
            tokenAccountData.value,
            tokenAccountData.token.decimals
          );

          const tokenIndex =
            tokenAccountData.token.contractAddress ??
            tokenAccountData.token.ticker;

          const balanceUSD =
            mobulaMarketData && mobulaMarketData[tokenIndex]
              ? mobulaMarketData[tokenIndex]?.price *
                parseFloat(balanceMainUnit as string)
              : undefined;

          return [
            ...tokenAcc,
            {
              logo:
                mobulaMarketData && mobulaMarketData[tokenIndex]
                  ? mobulaMarketData?.[tokenIndex].logo
                  : "",
              mainChainLogo: mainChainAsset.logo, // FIXME: To be replaced with blockchain Logo and not ticker
              assetId: tokenAccountData.token.id,
              chainId: tokenAccountData.token.chainId,
              name: tokenAccountData.token.name,
              balanceMainUnit: balanceMainUnit,
              balanceUSD: balanceUSD,
              ticker: tokenAccountData.token.ticker,
              address: mainChainAsset.address,
              contractAddress: tokenAccountData.token.contractAddress,
            },
          ];
        },
        []
      ) || [];

    return [...acc, mainChainAsset, ...tokenAssets];
  }, []);
};
