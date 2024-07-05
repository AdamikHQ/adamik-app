import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { TableCell, TableRow } from "~/components/ui/table";
import {
  TableCellWithTooltip,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { formatAmountUSD, formatAmount } from "~/utils/helper";
import { StakingPosition } from "./helpers";

export const StakingPositionRow: React.FC<{
  position: StakingPosition;
}> = ({ position }) => {
  const formattedAddresses = position.addresses.toString().replace(",", "\n");
  return (
    <TooltipProvider delayDuration={100}>
      <TableRow>
        <TableCell>
          <div>
            <div className="relative">
              <Tooltip text={position.chainId}>
                <TooltipTrigger>
                  <Avatar>
                    <AvatarImage
                      src={position.chainLogo}
                      alt={position.chainId}
                    />
                    <AvatarFallback>{position.chainId}</AvatarFallback>
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
