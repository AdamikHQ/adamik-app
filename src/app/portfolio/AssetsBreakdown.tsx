import _ from "lodash";
import { Loader2, Info } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { formatAmountUSD } from "~/utils/helper";
import { Asset } from "~/utils/types";
import { filterAndSortAssets } from "./helpers";
import { StakingPosition } from "../stake/helpers";

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
  stakingPositions?: StakingPosition[];
  totalBalance: number;
  hideLowBalance: boolean;
}> = ({
  isLoading,
  assets,
  totalBalance,
  hideLowBalance,
  stakingPositions = [],
}) => {
  const filteredAggregatedAssets = useMemo(() => {
    // FIXME Replace with Object.groupBy() when Node.js 21 becomes supported by Vercel
    // Group assets by chainId
    const assetsPerChain = _.groupBy(
      assets,
      (asset) => asset.chainId
    ) as Record<string, Asset[]>;

    // Aggregate the balance for each chain
    const aggregatedAssets = (
      Object.keys(assetsPerChain)
        .map((chainId) => {
          // Find the main asset of the chain
          const chain = assetsPerChain[chainId].find((asset) => !asset.assetId);
          if (chain) {
            // Sum the USD balance of the chain's main asset and all its tokens
            let totalBalanceUSD = assetsPerChain[chainId].reduce(
              (balance, asset) => balance + (asset.balanceUSD || 0),
              0
            );

            // Include all staking positions' USD balances for the chainId
            const stakingPositionsForChain = stakingPositions.filter(
              (position) => position.chainId === chainId
            );
            stakingPositionsForChain.forEach((stakingPosition) => {
              totalBalanceUSD +=
                (stakingPosition.amountUSD || 0) +
                (stakingPosition.rewardAmountUSD || 0);
            });

            // Return the main asset with the aggregated USD balance
            return {
              ...chain,
              balanceUSD: totalBalanceUSD,
            };
          }
        })
        .filter(Boolean) as Asset[]
    ).sort();

    return filterAndSortAssets(aggregatedAssets, hideLowBalance);
  }, [assets, hideLowBalance, stakingPositions]);

  return (
    <div className="order-first md:order-last">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between py-9">
          <div className="flex items-center">
            <CardTitle>Assets Breakdown</CardTitle>
            <Tooltip text="Shows the distribution of your assets per network">
              <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
            </Tooltip>
          </div>
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
            </>
          ) : (
            <Loader2 className="animate-spin" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
