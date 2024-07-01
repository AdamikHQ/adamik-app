import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { TableCell, TableRow } from "~/components/ui/table";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { formatAmountUSD, formatAmount } from "~/utils/helper";
import { Validator } from "./helpers";

export const ValidatorRow: React.FC<{
  validator: Validator;
  validatorAddress: string;
}> = ({ validator, validatorAddress }) => {
  return (
    <TooltipProvider delayDuration={100}>
      <TableRow>
        <TableCell>
          <div>
            <div className="relative">
              <Tooltip text={validator.chainId}>
                <TooltipTrigger>
                  <Avatar>
                    <AvatarImage
                      src={validator.chainLogo}
                      alt={validator.chainId}
                    />
                    <AvatarFallback>{validator.chainId}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
              </Tooltip>
            </div>
          </div>
        </TableCell>
        <TableCell>{validator.name || validator.validatorAddresses}</TableCell>
        <TableCell>
          {validator.amount ? formatAmount(validator.amount, 5) : ""}{" "}
          {validator.ticker}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {validator.amountUSD ? formatAmountUSD(validator.amountUSD) : "-"}
        </TableCell>
        <TableCell>{validator.status}</TableCell>
        <TableCell>
          {validator.rewardAmount
            ? `${formatAmount(validator.rewardAmount, 5)} ${validator.ticker}`
            : "-"}
        </TableCell>
      </TableRow>
    </TooltipProvider>
  );
};
