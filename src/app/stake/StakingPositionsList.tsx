import React, { useState } from "react";
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
import { RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";

const StakingPositionsListRow: React.FC<{
  position: StakingPosition;
}> = ({ position }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const formattedAddresses = position.addresses.toString().replace(",", "\n");

  // Separate token rewards into large and small amounts
  const largeTokenRewards =
    position.rewardTokens?.filter(
      (tokenAmount) => parseFloat(tokenAmount.amount) >= 0.00001
    ) || [];

  const smallTokenRewards =
    position.rewardTokens?.filter(
      (tokenAmount) =>
        parseFloat(tokenAmount.amount) > 0 &&
        parseFloat(tokenAmount.amount) < 0.00001
    ) || [];

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <TableRow>
        <TableCell>
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
        </TableCell>
        <TableCell>
          {position.validatorName || position.validatorAddresses.join(", ")}
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
          {/* Display Native Reward */}
          {position.rewardAmount && (
            <div>
              {`${formatAmount(position.rewardAmount, 5)} ${position.ticker}`}
            </div>
          )}

          {/* Display Token Reward Count and Toggle Button */}
          {(largeTokenRewards.length > 0 || smallTokenRewards.length > 0) && (
            <div
              style={{
                cursor: "pointer",
                color: "grey",
                textDecoration: "underline",
              }}
              onClick={handleToggleExpand}
            >
              {position.rewardTokens?.length} Token Reward
              {position.rewardTokens && position.rewardTokens.length > 1
                ? "s"
                : ""}
            </div>
          )}

          {/* Conditionally Render Token Rewards if Expanded */}
          {isExpanded && (
            <div className="mt-2">
              {/* Render tokens with significant value */}
              {largeTokenRewards.map((tokenAmount, index) => (
                <div key={index}>
                  {`${formatAmount(tokenAmount.amount, 5)} ${
                    tokenAmount.token.ticker
                  }`}
                </div>
              ))}
              {/* Render a single line for small value tokens */}
              {smallTokenRewards.length > 0 && (
                <div key="small-values">
                  {smallTokenRewards.length} token
                  {smallTokenRewards.length > 1 ? "s" : ""} &lt; 0.00001
                </div>
              )}
            </div>
          )}
        </TableCellWithTooltip>
      </TableRow>
    </TooltipProvider>
  );
};

export const StakingPositionsList = ({
  stakingPositions,
  refreshPositions,
}: {
  stakingPositions: Record<string, StakingPosition>;
  refreshPositions: () => void;
}) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          <div className="flex items-center gap-6">
            Positions
            <Tooltip text="Refresh">
              <Button onClick={() => refreshPositions()} className="p-2">
                <RefreshCw className="hover:animate-spin w-4" />
              </Button>
            </Tooltip>
          </div>
        </CardTitle>
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
