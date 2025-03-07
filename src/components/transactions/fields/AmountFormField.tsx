import { UseFormReturn } from "react-hook-form";
import { Checkbox } from "~/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { TransactionFormInput } from "~/utils/schema";

type AmountFormFieldProps = {
  form: UseFormReturn<TransactionFormInput>;
};

export function AmountFormField({ form }: AmountFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Amount</FormLabel>
          <FormControl>
            <div>
              <Input
                type="number"
                placeholder="amount"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
              />
              <FormField
                control={form.control}
                name="useMaxAmount"
                render={({ field: fieldSendMax }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={fieldSendMax.value}
                        onCheckedChange={fieldSendMax.onChange}
                      />
                    </FormControl>
                    <FormLabel className="space-y-1 leading-none">
                      Use Max
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
