import { UseFormReturn } from "react-hook-form";
import { StakingPosition } from "~/app/stake/helpers";
import { StakingPositionSelector } from "~/app/stake/StakingPositionSelector";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { TransactionFormInput } from "~/utils/schema";
import { Validator } from "~/utils/types";

type StakingPositionFormFieldProps = {
  form: UseFormReturn<TransactionFormInput>;
  stakingPositions: Record<string, StakingPosition>;
  validators: Validator[];
  //setDecimals: (decimals: number) => void;
  onStakingPositionChange: (stakingPosition: StakingPosition) => void; // Add this line
};

export function StakingPositionFormField({
  form,
  stakingPositions,
  validators,
  onStakingPositionChange, // Include the onStakingPositionChange prop here
}: StakingPositionFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name="validatorAddress"
      render={({ field }) => (
        <FormItem>
          <>
            <FormLabel>Positions</FormLabel>
            <FormControl>
              <StakingPositionSelector
                validators={validators.filter((validator) => {
                  const chainId = form.watch("chainId");
                  return chainId === "" ? true : validator.chainId === chainId;
                })}
                stakingPositions={Object.values(stakingPositions).filter(
                  (stakingPosition) => {
                    const chainId = form.watch("chainId");
                    return chainId === ""
                      ? true
                      : stakingPosition.chainId === chainId;
                  }
                )}
                selectedValue={
                  form.getValues().stakingPositionIndex
                    ? stakingPositions[
                        form.getValues().stakingPositionIndex as number
                      ]
                    : undefined
                }
                onSelect={(stakingPosition, index) => {
                  form.setValue("stakingPositionIndex", index);
                  form.setValue("chainId", stakingPosition.chainId);
                  form.setValue(
                    "validatorAddress",
                    stakingPosition.validatorAddresses[0]
                  );
                  //setDecimals(stakingPosition.decimals);
                  onStakingPositionChange(stakingPosition); // Trigger the prop passed to the component
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
