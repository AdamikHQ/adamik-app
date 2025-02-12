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
import { StakingPosition } from "~/app/stake/helpers";

type StakingTransactionProps = {
  mode: TransactionMode;
  assets: Asset[];
  stakingPositions: Record<string, StakingPosition>;
  validators: Validator[];
  onNextStep: () => void;
};

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
  const { transaction, setChainId, setTransaction, setTransactionHash } =
    useTransaction();
  const [errors, setErrors] = useState("");
  const [selectedStakingPosition, setSelectedStakingPosition] = useState<
    StakingPosition | undefined
  >();
  const label = useMemo(() => {
    switch (mode) {
      case TransactionMode.STAKE:
        return "Stake";
      case TransactionMode.UNSTAKE:
        return "Unstake";
      case TransactionMode.CLAIM_REWARDS:
        return "Claim";
      default:
        return "Submit";
    }
  }, [mode]);

  const onSubmit = useCallback(
    (formInput: TransactionFormInput) => {
      setChainId(undefined);
      setTransaction(undefined);
      setTransactionHash(undefined);
      setErrors("");

      const transactionData: TransactionData = {
        mode,
        chainId: formInput.chainId,
        senderAddress: formInput.sender,
        senderPubKey: assets.find((asset) => asset.address === formInput.sender)
          ?.pubKey,
        validatorAddress: formInput.validatorAddress ?? "",
        targetValidatorAddress: formInput.validatorAddress ?? "",
        useMaxAmount: formInput.useMaxAmount,
        format: "json", // FIXME Not always the default, should come from chains config
      };

      if (
        (mode === TransactionMode.UNSTAKE ||
          mode === TransactionMode.CLAIM_REWARDS) &&
        selectedStakingPosition
      ) {
        // Handle auto-setting of sender for unstake or claim rewards based on selected staking position
        transactionData.senderAddress = selectedStakingPosition.addresses[0]; // Automatically use the first address from staking position
      }

      if (formInput.amount !== undefined && !formInput.useMaxAmount) {
        transactionData.amount = amountToSmallestUnit(
          formInput.amount,
          decimals
        );
      }

      // FIXME Hack to be able to provide the pubKey, probably better to refacto
      const pubKey = assets.find(
        (asset) => asset.address === formInput.sender
      )?.pubKey;

      if (pubKey) {
        transactionData.senderPubKey = pubKey;
      }

      mutate(transactionData, {
        onSuccess: (response) => {
          setChainId(undefined);
          setTransaction(undefined);
          setTransactionHash(undefined);
          if (response) {
            if (response.status.errors && response.status.errors.length > 0) {
              setErrors(response.status.errors[0].message);
            } else {
              setChainId(response.chainId);
              setTransaction(response.transaction);
            }
          } else {
            setErrors("API ERROR - Please try again later");
          }
        },
        onError: (error) => {
          setChainId(undefined);
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
      setChainId,
      setTransaction,
      setTransactionHash,
      selectedStakingPosition,
    ]
  );

  const handleStakingPositionChange = (stakingPosition: StakingPosition) => {
    setSelectedStakingPosition(stakingPosition);

    const associatedAsset = assets.find(
      (asset) => asset.chainId === stakingPosition.chainId
    );

    if (associatedAsset) {
      setDecimals(associatedAsset.decimals);
    }

    if (
      mode === TransactionMode.UNSTAKE ||
      mode === TransactionMode.CLAIM_REWARDS
    ) {
      form.setValue("sender", stakingPosition.addresses[0]);
    }
  };

  if (isPending) {
    return <TransactionLoading />;
  }

  if (isSuccess && transaction) {
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-4">
          {mode === TransactionMode.STAKE && (
            <AssetFormField
              form={form}
              assets={assets}
              setDecimals={setDecimals}
              initialMode={TransactionMode.STAKE}
            />
          )}

          {mode === TransactionMode.STAKE && <SenderFormField form={form} />}

          {mode === TransactionMode.STAKE && (
            <ValidatorFormField
              form={form}
              validators={validators}
              setDecimals={setDecimals}
            />
          )}

          {(mode === TransactionMode.UNSTAKE ||
            mode === TransactionMode.CLAIM_REWARDS) && (
            <StakingPositionFormField
              mode={mode}
              form={form}
              stakingPositions={stakingPositions}
              validators={validators}
              onStakingPositionChange={handleStakingPositionChange}
              setDecimals={setDecimals}
            />
          )}

          {(mode === TransactionMode.STAKE ||
            mode === TransactionMode.UNSTAKE) && (
            <AmountFormField form={form} />
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
