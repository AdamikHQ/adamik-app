"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useTransaction } from "~/hooks/useTransaction";
import { useTransactionEncode } from "~/hooks/useTransactionEncode";
import { amountToSmallestUnit } from "~/utils/helper";
import { TransactionFormInput, transactionFormSchema } from "~/utils/schema";
import { Asset, TransactionMode, Validator } from "~/utils/types";
import { TransactionLoading } from "../portfolio/TransactionLoading";
import { ValidatorSelector } from "./ValidatorSelector";
import { AssetsSelector } from "../portfolio/AssetsSelector";

type TransactionProps = {
  onNextStep: () => void;
  assets: Asset[];
  validators: Validator[];
};

export function Transaction({
  onNextStep,
  validators,
  assets,
}: TransactionProps) {
  const { mutate, isPending, isSuccess } = useTransactionEncode();
  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      mode: TransactionMode.DELEGATE,
      chainId: "",
      senders: "",
      validatorAddress: "",
      amount: 0,
      useMaxAmount: false,
    },
  });
  const [decimals, setDecimals] = useState<number>(0);
  const {
    transaction,
    setTransaction,
    setSignedTransaction,
    setTransactionHash,
  } = useTransaction();
  const [errors, setErrors] = useState("");
  // const chainId = form.watch("chainId");

  function onSubmit(values: TransactionFormInput) {
    mutate(
      {
        mode: TransactionMode.DELEGATE,
        chainId: values.chainId,
        senders: [values.senders],
        recipients: [],
        validatorAddress: values.validatorAddress ?? "",
        amount: values.useMaxAmount
          ? ""
          : amountToSmallestUnit(values.amount.toString(), decimals),
        useMaxAmount: values.useMaxAmount,
        format: "json",
      },
      {
        onSettled: (values) => {
          setSignedTransaction(undefined);
          setTransactionHash(undefined);
          if (values) {
            if (
              values.transaction.status.errors &&
              values.transaction.status.errors.length > 0
            ) {
              setErrors(values.transaction.status.errors[0].message);
              setTransaction(undefined);
            } else {
              setTransaction(values);
            }
          } else {
            setTransaction(undefined);
            setErrors("API ERROR - Please try again later");
          }
        },
        onError: (error) => {
          setSignedTransaction(undefined);
          setTransactionHash(undefined);
          setErrors("API ERROR - Please try again later :" + error.message);
        },
      }
    );
  }

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
      <h1 className="font-bold text-xl text-center">Transfer</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-4">
          <FormField
            control={form.control}
            name="chainId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset</FormLabel>
                <FormControl>
                  <AssetsSelector
                    assets={assets}
                    selectedValue={
                      form.getValues().assetIndex
                        ? assets[form.getValues().assetIndex as number]
                        : undefined
                    }
                    onSelect={(asset, index) => {
                      form.setValue("assetIndex", index);
                      form.setValue("chainId", asset.chainId);
                      form.setValue("senders", asset.address);
                      form.resetField("validatorIndex");
                      form.resetField("validatorAddress");
                      setDecimals(asset.decimals);
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senders"
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
                        return chainId === ""
                          ? true
                          : validator.chainId === chainId;
                      })}
                      selectedValue={
                        form.getValues().validatorIndex
                          ? validators[
                              form.getValues().validatorIndex as number
                            ]
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

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <>
                    <Input type="number" placeholder="amount" {...field} />
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
                          <div className="space-y-1 leading-none">
                            <FormLabel>Send Max</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
