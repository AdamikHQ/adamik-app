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

type TypeFormFieldProps = {
  form: UseFormReturn<TransactionFormInput>;
};

export function TypeFormField({ form }: TypeFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Type</FormLabel>
          <FormControl>
            <Input placeholder="Type" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
