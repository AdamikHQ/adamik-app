import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  TableCellWithTooltip,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { formatAmountUSD, formatAmount } from "~/utils/helper";
import { StakingPosition } from "./helpers";

const StakingPositionsListRow: React.FC<{
  position: StakingPosition;
}> = ({ position }) => {
  const formattedAddresses = position.addresses.toString().replace(",", "\n");
  return (
    <TooltipProvider delayDuration={100}>
      <TableRow>
        <TableCell>
          <div>
            <div className="relative">
              <Tooltip text={position.chainName}>
                <TooltipTrigger>
                  <Avatar>
                    <AvatarImage
                      src={position.chainLogo}
                      alt={position.chainId}
                    />
                    <AvatarFallback>{position.chainName}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
              </Tooltip>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {position.validatorName || position.validatorAddresses}
        </TableCell>

        <TableCellWithTooltip text={formattedAddresses}>
          {position.amount ? formatAmount(position.amount, 5) : ""}{" "}
          {position.ticker}
        </TableCellWithTooltip>

        <TableCellWithTooltip text={formattedAddresses}>
          {position.amountUSD ? formatAmountUSD(position.amountUSD) : "-"}
        </TableCellWithTooltip>

        <TableCellWithTooltip text={formattedAddresses}>
          {position.status}
        </TableCellWithTooltip>

        <TableCellWithTooltip text={formattedAddresses}>
          {position.rewardAmount
            ? `${formatAmount(position.rewardAmount, 5)} ${position.ticker}`
            : "-"}
        </TableCellWithTooltip>
      </TableRow>
    </TooltipProvider>
  );
};

export const StakingPositionsList = ({
  stakingPositions,
}: {
  stakingPositions: Record<string, StakingPosition>;
}) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Positions</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] md:table-cell"></TableHead>
            <TableHead>Validator</TableHead>
            <TableHead>Amount staked</TableHead>
            <TableHead>Amount (USD)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Claimable rewards</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.keys(stakingPositions).length > 0 ? (
            Object.entries(stakingPositions)
              .sort((a, b) => {
                return (b[1].amountUSD || 0) - (a[1].amountUSD || 0);
              })
              .map(([validatorAddress, position]) => (
                <StakingPositionsListRow
                  key={validatorAddress}
                  position={position}
                />
              ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No validator found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
