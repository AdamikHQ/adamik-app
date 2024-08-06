import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatAmountUSD } from "~/utils/helper";
import { AggregatedBalances } from "~/utils/types";

type StakingBalancesProps = {
  aggregatedBalances: AggregatedBalances;
};

export const StakingBalances = ({
  aggregatedBalances,
}: StakingBalancesProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Available balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatAmountUSD(aggregatedBalances.availableBalance)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Staked Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatAmountUSD(aggregatedBalances.stakedBalance)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Claimable Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatAmountUSD(aggregatedBalances.claimableRewards)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Unstaking Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatAmountUSD(aggregatedBalances.unstakingBalance)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
