import { UseFormReturn } from "react-hook-form";
import { AssetsSelector } from "~/app/portfolio/AssetsSelector";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { TransactionFormInput } from "~/utils/schema";
import { Asset, TransactionMode } from "~/utils/types";

type AssetFormFieldProps = {
  form: UseFormReturn<TransactionFormInput>;
  assets: Asset[];
  setDecimals: (decimals: number) => void;
  initialMode: TransactionMode;
};

export function AssetFormField({
  form,
  assets,
  setDecimals,
  initialMode,
}: AssetFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name="chainId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Asset</FormLabel>
          <FormControl>
            <AssetsSelector
              assets={assets}
              selectedValue={
                form.getValues().assetIndex
                  ? assets[form.getValues().assetIndex as number]
                  : undefined
              }
              onSelect={(asset, index) => {
                form.setValue("assetIndex", index);
                form.setValue("chainId", asset.chainId);
                form.setValue("sender", asset.address);

                // Clear the validator-related fields
                form.setValue("validatorIndex", undefined);
                form.setValue("validatorAddress", "");

                if (asset.isToken) {
                  form.setValue("mode", TransactionMode.TRANSFER_TOKEN);
                  form.setValue(
                    "tokenId",
                    asset.contractAddress || asset.assetId
                  );
                } else {
                  form.setValue("tokenId", undefined);
                  form.setValue("mode", initialMode);
                }
                setDecimals(asset.decimals);
              }}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
