import { Loader2, Info } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Asset } from "~/utils/types";
import {
  TableCellWithTooltip,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { formatAmount, formatAmountUSD } from "~/utils/helper";

const AssetsListRow: React.FC<{ asset: Asset }> = ({ asset }) => {
  return (
    <TooltipProvider delayDuration={100}>
      <TableRow>
        <TableCell>
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
                  <Tooltip text={asset.mainChainName || asset.chainId}>
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
        </TableCell>

        <TableCellWithTooltip text={asset.address}>
          {asset?.ticker}
        </TableCellWithTooltip>

        <TableCellWithTooltip text={asset.address}>
          {asset?.balanceMainUnit ? formatAmount(asset.balanceMainUnit, 5) : ""}{" "}
          {asset?.ticker}
        </TableCellWithTooltip>

        <TableCellWithTooltip text={asset.address}>
          {asset?.balanceUSD ? formatAmountUSD(asset.balanceUSD) : "-"}
        </TableCellWithTooltip>
      </TableRow>
    </TooltipProvider>
  );
};

export const AssetsList: React.FC<{
  isLoading: boolean;
  assets: Asset[];
  openTransaction: boolean;
  setOpenTransaction: (value: boolean) => void;
  hideLowBalance: boolean;
  setHideLowBalance: (value: boolean) => void;
}> = ({
  isLoading,
  assets,
  openTransaction,
  setOpenTransaction,
  hideLowBalance,
  setHideLowBalance,
}) => {
  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <CardTitle>Assets</CardTitle>
            <Tooltip text="List of your available assets and their balances">
              <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
            </Tooltip>
          </div>
          <Button
            type="submit"
            onClick={() => setOpenTransaction(!openTransaction)}
          >
            Transfer
          </Button>
        </CardHeader>
        <CardContent>
          {!isLoading ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]"></TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Balance
                    </TableHead>
                    <TableHead>Amount (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="overflow-y-auto max-h-[360px]">
                  {assets.length > 0 ? (
                    assets.map((asset, i) => {
                      if (!asset) return null;
                      return (
                        <AssetsListRow
                          key={`${i}_${asset.name}`}
                          asset={asset}
                        />
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5}>
                        No asset has been found. Please make sure you have
                        assets in your wallet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          ) : (
            <Loader2 className="animate-spin" />
          )}
        </CardContent>
      </Card>
    </>
  );
};
