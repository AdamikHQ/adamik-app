import _ from "lodash";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { formatAmountUSD } from "~/utils/helper";
import { Asset } from "~/utils/types";
import { useMemo, useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { filterAndSortAssets } from "./helpers";

const AssetsBreakdownRow: React.FC<{
  asset: Asset;
  totalBalance: number;
}> = ({ asset, totalBalance }) => {
  const assetPercentage = useMemo(() => {
    return Math.round(((asset.balanceUSD || 0) / totalBalance) * 10000) / 100;
  }, [asset, totalBalance]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center gap-4">
        <div>
          {asset?.logo && (
            <div className="relative">
              <Tooltip text={asset.name}>
                <TooltipTrigger>
                  <Avatar className="w-[38px] h-[38px]">
                    <AvatarImage src={asset?.logo} alt={asset.name} />
                    <AvatarFallback>{asset.name}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
              </Tooltip>
              {asset.mainChainLogo && (
                <Tooltip text={asset.chainId}>
                  <TooltipTrigger>
                    <div className="absolute w-5 h-5 text-xs font-bold text-primary bg-primary-foreground border-2 rounded-full -top-2 end-2">
                      <Avatar className="h-4 w-4">
                        <AvatarImage
                          src={asset.mainChainLogo}
                          alt={asset.chainId}
                        />
                        <AvatarFallback>{asset.chainId}</AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                </Tooltip>
              )}
            </div>
          )}
        </div>
        <div className="grid gap-1">
          <p className="text-sm font-medium leading-none">{asset.name}</p>
          <p className="text-sm text-muted-foreground">
            {asset?.balanceUSD !== undefined
              ? formatAmountUSD(asset.balanceUSD)
              : "-"}
          </p>
        </div>
        <div className="ml-auto font-medium">{assetPercentage}%</div>
      </div>
      <br />
    </TooltipProvider>
  );
};

export const AssetsBreakdown: React.FC<{
  isLoading: boolean;
  assets: Asset[];
  totalBalance: number;
  hideLowBalance: boolean;
  setHideLowBalance: (value: boolean) => void;
}> = ({
  isLoading,
  assets,
  totalBalance,
  hideLowBalance,
  setHideLowBalance,
}) => {
  const filteredAggregatedAssets = useMemo(() => {
    // Group assets by chainId
    // FIXME Replace with Object.groupBy() when Node.js 21 becomes supported by Vercel
    const assetsPerChain = _.groupBy(
      assets,
      (asset) => asset.chainId
    ) as Record<string, Asset[]>;

    // Aggregate chains by their total USD balance
    const aggregatedAssets = (
      Object.keys(assetsPerChain)
        // For each chain
        .map((chainId) => {
          // Identify the main asset of the chain, as the only one that doesn't have an 'assetId'
          const chain = assetsPerChain[chainId].find((asset) => !asset.assetId);
          if (chain) {
            // Aggregate the USD balance of the main asset + all tokens
            const totalBalanceUSD = assetsPerChain[chainId].reduce(
              (balance, asset) => balance + (asset.balanceUSD || 0),
              0
            );

            return {
              ...chain,
              balanceUSD: totalBalanceUSD,
            };
          }
        })
        .filter(Boolean) as Asset[]
    ).sort();

    return filterAndSortAssets(aggregatedAssets, hideLowBalance);
  }, [assets, hideLowBalance]);

  return (
    <div className="order-first md:order-last">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between py-9">
          <CardTitle>Assets Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading ? (
            <>
              {filteredAggregatedAssets.length > 0 &&
                filteredAggregatedAssets.map((asset, i) => {
                  if (!asset) return null;
                  return (
                    <AssetsBreakdownRow
                      key={`${i}_${asset.name}`}
                      asset={asset}
                      totalBalance={totalBalance}
                    />
                  );
                })}
              <div className="items-top flex space-x-2">
                <Checkbox
                  id="hideBalanceAssetsBreakdown"
                  checked={hideLowBalance}
                  onClick={() => {
                    setHideLowBalance(!hideLowBalance);
                  }}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="hideBalanceAssetsBreakdown"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {`Hide low balances (< 1$)`}
                  </label>
                </div>
              </div>
            </>
          ) : (
            <Loader2 className="animate-spin" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
