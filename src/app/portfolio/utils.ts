import { GetAddressStateResponse } from "~/api/addressState";
import { getChainDetailsResponse } from "~/api/chainDetails";
import { MobulaMarketMultiDataTickersResponse } from "~/api/mobula/marketMultiDataTickers";
import { Asset } from "~/lib/types";
import { amountToMainUnit } from "~/lib/utils";

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
      ...(accountData.balances.tokens
        ?.map((token) => token.token.ticker)
        .filter(Boolean) || []),
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
  mobulaMarketData: MobulaMarketMultiDataTickersResponse | undefined | null
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
    };

    const tokenAssets =
      accountData.balances.tokens?.reduce<Asset[]>(
        (tokenAcc, tokenAccountData) => {
          if (!tokenAccountData) return tokenAcc;

          const balanceMainUnit = amountToMainUnit(
            tokenAccountData.value,
            tokenAccountData.token.decimals
          );

          const balanceUSD =
            mobulaMarketData && mobulaMarketData[tokenAccountData.token.ticker]
              ? mobulaMarketData[tokenAccountData.token.ticker]?.price *
                parseFloat(balanceMainUnit as string)
              : undefined;

          return [
            ...tokenAcc,
            {
              logo:
                mobulaMarketData &&
                mobulaMarketData[tokenAccountData.token.ticker]
                  ? mobulaMarketData?.[tokenAccountData.token.ticker].logo
                  : "",
              assetId: tokenAccountData.token.id,
              chainId: tokenAccountData.token.chainId,
              name: tokenAccountData.token.name,
              balanceMainUnit: balanceMainUnit,
              balanceUSD: balanceUSD,
              ticker: tokenAccountData.token.ticker,
            },
          ];
        },
        []
      ) || [];

    return [...acc, mainChainAsset, ...tokenAssets];
  }, []);
};

export const mergedAssetsById = (assets: Asset[]) => {
  return Object.values(
    assets.reduce<Record<string, Asset>>((acc, asset) => {
      const newAcc: Record<string, Asset> = { ...acc };
      if (asset.assetId) {
        if (newAcc[asset.assetId]) {
          newAcc[asset.assetId].balanceUSD =
            (newAcc[asset.assetId].balanceUSD ?? 0) + (asset.balanceUSD || 0);
          newAcc[asset.assetId].subAssets!.push(asset);
        } else {
          newAcc[asset.assetId] = { ...asset, subAssets: [{ ...asset }] };
        }
      } else {
        if (newAcc[asset.chainId]) {
          newAcc[asset.chainId].balanceUSD =
            (newAcc[asset.chainId].balanceUSD || 0) + (asset.balanceUSD || 0);
          newAcc[asset.chainId].subAssets!.push(asset);
        } else {
          newAcc[asset.chainId] = { ...asset, subAssets: [{ ...asset }] };
        }
      }
      return newAcc;
    }, {})
  );
};
