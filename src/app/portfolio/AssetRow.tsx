import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { TableCell, TableRow } from "~/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { formatAmountUSD } from "~/utils/helper";
import { Asset } from "~/utils/types";

export const AssetRow: React.FC<{ asset: Asset }> = ({ asset }) => {
  return (
    <>
      <TooltipProvider delayDuration={100}>
        <TableRow>
          <TableCell className="hidden md:table-cell">
            <div>
              {asset?.logo && (
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="w-[38px] h-[38px]">
                        <AvatarImage src={asset?.logo} alt={asset.name} />
                        <AvatarFallback>{asset.name}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{asset.name}</p>
                    </TooltipContent>
                  </Tooltip>
                  {asset.mainChainLogo && (
                    <Tooltip>
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
                      <TooltipContent>
                        <p>{asset.chainId}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          </TableCell>
          <TableCell>{asset?.ticker}</TableCell>
          <TableCell className="hidden md:table-cell">
            {asset?.balanceMainUnit} {asset?.ticker}
          </TableCell>
          <TableCell>
            {asset?.balanceUSD ? formatAmountUSD(asset.balanceUSD) : "-"}
          </TableCell>
        </TableRow>
      </TooltipProvider>
    </>
  );
};