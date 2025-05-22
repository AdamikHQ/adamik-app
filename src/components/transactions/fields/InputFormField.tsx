import { FieldPath, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { TransactionFormInput } from "~/utils/schema";

type InputFormFieldProps = {
  form: UseFormReturn<TransactionFormInput>;
  fieldName: FieldPath<TransactionFormInput>;
  label: string;
};

export function InputFormField({
  form,
  fieldName,
  label,
}: InputFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {/* @ts-ignore */}
            <Input placeholder={label} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
