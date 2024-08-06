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

type RecipientFormFieldProps = {
  form: UseFormReturn<TransactionFormInput>;
};

export function RecipientFormField({ form }: RecipientFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name="recipients"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Recipient</FormLabel>
          <FormControl>
            <Input placeholder="Recipient" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
