import { AccountState, Asset, Chain, Feature } from "~/utils/types";
import { amountToMainUnit, formatAmount, resolveLogo } from "~/utils/helper";
import { MobulaMarketMultiDataResponse } from "~/api/mobula/marketMultiData";
import { MobulaBlockchain } from "~/api/mobula/types";
import { Address } from "../wallets/types";

export const getTickers = (data: (Chain | undefined | null)[]) => {
  const reducedArray = data.reduce<string[]>((acc, chainDetail) => {
    if (!chainDetail) return acc;
    return [...acc, chainDetail.ticker];
  }, []);
  return Array.from(new Set(reducedArray));
};

export const getTokenTickers = (data: (AccountState | undefined | null)[]) => {
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
  data: (AccountState | undefined | null)[]
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
  data: (AccountState | undefined | null)[]
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

// TODO Probably need to refacto a bit the model, to handle all the different data sources in a simpler way
export const calculateAssets = (
  walletAddresses: Address[],
  addressesData: (AccountState | undefined | null)[],
  chainsDetails: (Chain | undefined | null)[],
  mobulaMarketData: MobulaMarketMultiDataResponse | undefined | null,
  mobulaBlockChainData: MobulaBlockchain[] | undefined
): Asset[] => {
  return addressesData.reduce<Asset[]>((acc, accountData) => {
    if (!accountData) return [...acc];

    const chainDetails = chainsDetails.find(
      (chainDetail) => chainDetail?.id === accountData.chainId
    );

    const walletAddress = walletAddresses.find(
      (address) => address.address === accountData.accountId
    );

    if (!chainDetails || !walletAddress) {
      return [...acc];
    }
    const balanceMainUnit = amountToMainUnit(
      accountData.balances.native.available,
      chainDetails!.decimals
    );

    const balanceUSD =
      // !chainDetails.isTestNet && TMP: Just to usetestnet for test
      mobulaMarketData && mobulaMarketData[chainDetails.ticker]
        ? mobulaMarketData[chainDetails.ticker]?.price *
        parseFloat(balanceMainUnit as string)
        : undefined;

    const mainChainAsset = {
      logo: resolveLogo({
        asset: {
          name: chainDetails.name,
          ticker: chainDetails.ticker,
        },
        mobulaMarketData,
        mobulaBlockChainData: mobulaBlockChainData,
      }),
      chainId: accountData.chainId,
      name: chainDetails.name,
      balanceMainUnit,
      balanceUSD,
      ticker: chainDetails.ticker,
      address: accountData.accountId,
      pubKey: walletAddress.pubKey,
      decimals: chainDetails.decimals,
      isToken: false,
      isStakable: chainDetails.supportedFeatures.includes(
        Feature.READ_ACCOUNT_BALANCES_STAKING
      ),
    };

    const tokenAssets =
      accountData.balances.tokens?.reduce<Asset[]>(
        (tokenAcc, tokenAccountData) => {
          if (!tokenAccountData) return tokenAcc;

          const balanceMainUnit = amountToMainUnit(
            tokenAccountData.amount,
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
              logo: resolveLogo({
                asset: {
                  name: tokenAccountData.token.name || "",
                  ticker: tokenIndex,
                },
                mobulaMarketData,
                mobulaBlockChainData: mobulaBlockChainData,
              }),
              mainChainLogo: mainChainAsset.logo,
              mainChainName: mainChainAsset.name || mainChainAsset.chainId,
              address: mainChainAsset.address,
              pubKey: walletAddress.pubKey,
              assetId: tokenAccountData.token.id,
              chainId: tokenAccountData.token.chainId,
              name: tokenAccountData.token.name,
              balanceMainUnit: balanceMainUnit,
              balanceUSD: balanceUSD,
              ticker: tokenAccountData.token.ticker,
              contractAddress: tokenAccountData.token.contractAddress,
              decimals: tokenAccountData.token.decimals,
              isToken: true,
            },
          ];
        },
        []
      ) || [];

    return [...acc, mainChainAsset, ...tokenAssets];
  }, []);
};

export const filterAndSortAssets = (
  assets: Asset[],
  hideLowBalance: boolean
) => {
  // Aggregate the balance for each chainId
  const aggregatedBalances: Record<string, number> = {};

  assets.forEach((asset) => {
    if (!aggregatedBalances[asset.chainId]) {
      aggregatedBalances[asset.chainId] = 0;
    }
    aggregatedBalances[asset.chainId] += asset.balanceUSD || 0;
  });

  return (
    assets
      // Remove empty items
      .filter(Boolean)
      // Apply low balances filter if necessary
      .filter((asset) => {
        return !(hideLowBalance && aggregatedBalances[asset.chainId] <= 1);
      })
      // Hide all asset without logo (mostly spam coins for EVM)
      .filter((asset) => {
        return asset?.logo !== "";
      })

      .sort((a, b) => {
        // Highest to lowest USD balance
        return (b.balanceUSD || 0) - (a.balanceUSD || 0);
      })
  );
};
