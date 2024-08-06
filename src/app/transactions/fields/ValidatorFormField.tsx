import { UseFormReturn } from "react-hook-form";
import { ValidatorSelector } from "~/app/stake/ValidatorSelector";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { TransactionFormInput } from "~/utils/schema";
import { Validator } from "~/utils/types";

type ValidatorFormFieldProps = {
  form: UseFormReturn<TransactionFormInput>;
  validators: Validator[];
  setDecimals: (decimals: number) => void;
};

export function ValidatorFormField({
  form,
  validators,
  setDecimals,
}: ValidatorFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name="validatorAddress"
      render={({ field }) => (
        <FormItem>
          <>
            <FormLabel>Validators</FormLabel>
            <FormControl>
              <ValidatorSelector
                validators={validators.filter((validator) => {
                  const chainId = form.watch("chainId");
                  return chainId === "" ? true : validator.chainId === chainId;
                })}
                selectedValue={
                  form.getValues().validatorIndex
                    ? validators[form.getValues().validatorIndex as number]
                    : undefined
                }
                onSelect={(validator, index) => {
                  form.setValue("validatorIndex", index);
                  form.setValue("chainId", validator.chainId);
                  form.setValue("validatorAddress", validator.address);
                  setDecimals(validator.decimals);
                }}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </>
        </FormItem>
      )}
    />
  );
}
