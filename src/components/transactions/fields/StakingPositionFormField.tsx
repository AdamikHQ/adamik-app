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
import { Validator, TransactionMode } from "~/utils/types";

type StakingPositionFormFieldProps = {
  form: UseFormReturn<TransactionFormInput>;
  stakingPositions: Record<string, StakingPosition>;
  validators: Validator[];
  setDecimals: (decimals: number) => void; // Ensure this prop is used
  onStakingPositionChange: (stakingPosition: StakingPosition) => void;
  mode: TransactionMode;
};

export function StakingPositionFormField({
  form,
  stakingPositions,
  validators,
  onStakingPositionChange,
  mode,
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
                mode={mode}
                validators={validators}
                stakingPositions={Object.values(stakingPositions)}
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
                  form.setValue("stakeId", stakingPosition.stakeId);

                  // Trigger the prop passed to the component
                  onStakingPositionChange(stakingPosition);
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
