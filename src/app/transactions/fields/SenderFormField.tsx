import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { TransactionFormInput } from "~/utils/schema";

type AssetFormFieldProps = {
  form: UseFormReturn<TransactionFormInput>;
};

export function SenderFormField({ form }: AssetFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name="sender"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Sender</FormLabel>
          <FormControl>
            <Input readOnly placeholder="Sender" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
