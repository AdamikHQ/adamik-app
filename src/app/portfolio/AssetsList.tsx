import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { AssetRow } from "./AssetRow";
import { filterAndSortAssets } from "./helpers";
import { Asset } from "~/utils/types";

export const AssetsList: React.FC<{
  isLoading: boolean;
  assets: Asset[];
  openTransaction: boolean;
  setOpenTransaction: (value: boolean) => void; // TODO
}> = ({ isLoading, assets, openTransaction, setOpenTransaction }) => {
  const [hideLowBalance, setHideLowBalance] = useState(true);

  const filteredAssets = useMemo(
    () => filterAndSortAssets(assets, hideLowBalance),
    [assets, hideLowBalance]
  );

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assets</CardTitle>
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
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset, i) => {
                      if (!asset) return null;
                      return (
                        <AssetRow key={`${i}_${asset.name}`} asset={asset} />
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
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="items-top flex space-x-2">
                        <Checkbox
                          id="hideBalance"
                          checked={hideLowBalance}
                          onClick={() => {
                            setHideLowBalance(!hideLowBalance);
                          }}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="hideBalance"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {`Hide low balance assets (< 1$)`}
                          </label>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
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
