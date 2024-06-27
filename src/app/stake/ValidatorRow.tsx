import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { TableCell, TableRow } from "~/components/ui/table";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { formatAmountUSD } from "~/utils/helper";
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
              <Tooltip text={validatorAddress}>
                <TooltipTrigger>
                  <Avatar className="w-[38px] h-[38px]">
                    <AvatarFallback>{validatorAddress[0]}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
              </Tooltip>
              {validator.chainLogo && (
                <Tooltip text={validator.chainId}>
                  <TooltipTrigger>
                    <div className="absolute w-5 h-5 text-xs font-bold text-primary bg-primary-foreground border-2 rounded-full -top-2 end-2">
                      <Avatar className="h-4 w-4">
                        <AvatarImage
                          src={validator.chainLogo}
                          alt={validator.chainId}
                        />
                        <AvatarFallback>{validator.chainId}</AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                </Tooltip>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>{validator.validatorAddresses}</TableCell>
        <TableCell>{validator.amount}</TableCell>
        <TableCell className="hidden md:table-cell">
          {validator.amountUSD ? formatAmountUSD(validator.amountUSD) : "-"}
        </TableCell>
        <TableCell>{validator.status}</TableCell>
        <TableCell>{validator.rewardAmount}</TableCell>
      </TableRow>
    </TooltipProvider>
  );
};
