"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Form } from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { useTransaction } from "~/hooks/useTransaction";
import { useEncodeTransaction } from "~/hooks/useEncodeTransaction";
import { amountToSmallestUnit } from "~/utils/helper";
import { TransactionFormInput, transactionFormSchema } from "~/utils/schema";
import {
  Asset,
  TransactionData,
  TransactionMode,
  Validator,
} from "~/utils/types";
import { TransactionLoading } from "~/app/portfolio/TransactionLoading";
import { AssetFormField } from "./fields/AssetFormField";
import { SenderFormField } from "./fields/SenderFormField";
import { ValidatorFormField } from "./fields/ValidatorFormField";
import { AmountFormField } from "./fields/AmountFormField";
import { StakingPositionFormField } from "./fields/StakingPositionFormField";
import { StakingPosition } from "../stake/helpers";

type StakingTransactionProps = {
  mode: TransactionMode;
  assets: Asset[];
  stakingPositions: Record<string, StakingPosition>;
  validators: Validator[];
  onNextStep: () => void;
};

// TODO Only works for Cosmos !!! API abstraction still needed

// FIXME Some duplicate logic to put in common with ./TransferTransactionForm.tsx

export function StakingTransactionForm({
  mode,
  assets,
  stakingPositions,
  validators,
  onNextStep,
}: StakingTransactionProps) {
  const { mutate, isPending, isSuccess } = useEncodeTransaction();
  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      mode,
      chainId: "",
      sender: "",
      validatorAddress: "",
      amount: undefined,
      useMaxAmount: false,
    },
  });
  const [decimals, setDecimals] = useState<number>(0);
  const { transaction, setTransaction, setTransactionHash } = useTransaction();
  const [errors, setErrors] = useState("");

  // Add a state to keep track of the selected staking position
  const [selectedStakingPosition, setSelectedStakingPosition] =
    useState<StakingPosition | null>(null);

  const label = useMemo(() => {
    switch (mode) {
      case TransactionMode.DELEGATE:
        return "Stake";
      case TransactionMode.UNDELEGATE:
        return "Unstake";
      case TransactionMode.CLAIM_REWARDS:
        return "Claim";
    }
  }, [mode]);

  const onSubmit = useCallback(
    (formInput: TransactionFormInput) => {
      console.log("Submit handler triggered");
      console.log("Form submitted with input:", formInput);

      const transactionData: TransactionData = {
        mode,
        chainId: formInput.chainId,
        sender: formInput.sender || "", // If unstaking, sender can be derived from the staking position
        recipient: "",
        validatorAddress: formInput.validatorAddress ?? "",
        useMaxAmount: formInput.useMaxAmount,
        format: "json", // FIXME Not always the default, should come from chains config
      };

      if (formInput.amount && !formInput.useMaxAmount) {
        transactionData.amount = amountToSmallestUnit(
          formInput.amount.toString(),
          decimals
        );
      }

      console.log("Transaction data before mutation:", transactionData);

      // Handle auto-setting of sender for unstake or claim rewards based on selected staking position
      if (mode !== TransactionMode.DELEGATE && selectedStakingPosition) {
        console.log("Selected staking position:", selectedStakingPosition); // Log the selected staking position
        transactionData.sender = selectedStakingPosition.addresses[0]; // Use the first address in the array for sender
        console.log(
          "Auto-determined sender from staking position:",
          transactionData.sender
        );
      }

      mutate(transactionData, {
        onSuccess: (settledTransaction) => {
          console.log("Transaction success:", settledTransaction);
          setTransaction(undefined);
          setTransactionHash(undefined);
          if (settledTransaction) {
            if (
              settledTransaction.status.errors &&
              settledTransaction.status.errors.length > 0
            ) {
              setErrors(settledTransaction.status.errors[0].message);
              console.log(
                "Transaction error message:",
                settledTransaction.status.errors[0].message
              );
            } else {
              setTransaction(settledTransaction);
            }
          } else {
            setErrors("API ERROR - Please try again later");
            console.log("API ERROR - Please try again later");
          }
        },
        onError: (error) => {
          console.log("Transaction error:", error.message);
          setTransaction(undefined);
          setTransactionHash(undefined);
          setErrors(error.message);
        },
      });
    },
    [
      assets,
      decimals,
      mode,
      mutate,
      selectedStakingPosition,
      setTransaction,
      setTransactionHash,
    ]
  );

  const handleStakingPositionChange = (stakingPosition: StakingPosition) => {
    console.log("Staking position selected:", stakingPosition);
    setSelectedStakingPosition(stakingPosition); // Track the selected staking position
    form.setValue("sender", stakingPosition.addresses[0]); // Set the sender value based on the staking position's address
  };

  const handleError = (errors: any) => {
    console.log("Form validation failed:", errors);
  };

  if (isPending) {
    return <TransactionLoading />;
  }

  if (isSuccess && transaction) {
    console.log("Transaction is ready:", transaction);
    return (
      <>
        <h1 className="font-bold text-xl text-center">
          Your transaction is ready
        </h1>
        <p className="text-center text-sm text-gray-400">
          Adamik has converted your intent into a blockchain transaction. <br />
          Review your transaction details before signing
        </p>
        <Button onClick={() => onNextStep()} className="w-full mt-8">
          Sign your Transaction
        </Button>
        <Collapsible>
          <CollapsibleTrigger className="text-sm text-gray-500 text-center mx-auto block flex items-center justify-center">
            <ChevronDown className="mr-2" size={16} />
            Show unsigned transaction
            <ChevronDown className="ml-2" size={16} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Textarea
              readOnly
              value={JSON.stringify(transaction)}
              className="h-32 text-xs text-gray-500 mt-4"
            />
          </CollapsibleContent>
        </Collapsible>
      </>
    );
  }

  return (
    <>
      <h1 className="font-bold text-xl text-center">{label}</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, handleError)}
          className="space-y-8 px-4"
        >
          {mode === TransactionMode.DELEGATE && (
            <AssetFormField
              form={form}
              assets={assets}
              setDecimals={setDecimals}
            />
          )}

          {mode === TransactionMode.DELEGATE && <SenderFormField form={form} />}

          {mode === TransactionMode.DELEGATE && (
            <ValidatorFormField
              form={form}
              validators={validators}
              setDecimals={setDecimals}
            />
          )}

          {(mode === TransactionMode.UNDELEGATE ||
            mode === TransactionMode.CLAIM_REWARDS) && (
            <StakingPositionFormField
              form={form}
              stakingPositions={stakingPositions}
              validators={validators}
              onStakingPositionChange={handleStakingPositionChange} // Pass handler to track selected staking position
            />
          )}

          {(mode === TransactionMode.DELEGATE ||
            mode === TransactionMode.UNDELEGATE) && (
            <AmountFormField form={form} />
          )}

          {form.formState.errors && (
            <div className="text-red-500">
              {(
                Object.keys(form.formState.errors) as Array<
                  keyof typeof form.formState.errors
                >
              ).map((key) => (
                <div key={key}>
                  Error in {key}: {form.formState.errors[key]?.message}
                </div>
              ))}
            </div>
          )}

          {errors && (
            <div className="text-red-500 w-full break-all">{errors}</div>
          )}

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </Form>
    </>
  );
}
