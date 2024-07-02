"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { TransactionFormInput, transactionFormSchema } from "~/utils/schema";
import { Asset, TransactionMode } from "~/utils/types";
import { AssetSelector } from "./AssetSelector";
import { useTransactionEncode } from "~/hooks/useTransactionEncode";
import { useState } from "react";
import { amountToSmallestUnit } from "~/utils/helper";
import { TransactionLoading } from "./TransactionLoading";
import { Textarea } from "~/components/ui/textarea";
import { useTransaction } from "~/hooks/useTransaction";

type TransactionProps = {
  onNextStep: () => void;
  assets: Asset[];
};

export function Transaction({ onNextStep, assets }: TransactionProps) {
  const { mutate, isPending, isSuccess, error } = useTransactionEncode();
  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      mode: TransactionMode.TRANSFER,
      chainId: "",
      tokenId: "",
      senders: "",
      recipients: "",
      amount: 0,
      useMaxAmount: false,
    },
  });
  const [decimals, setDecimals] = useState<number>(0);
  const { transaction, setTransaction } = useTransaction();
  const [errors, setErrors] = useState("");

  function onSubmit(values: TransactionFormInput) {
    mutate(
      {
        ...values,
        chainId: values.chainId,
        recipients: [values.recipients],
        senders: [values.senders],
        amount: values.useMaxAmount
          ? ""
          : amountToSmallestUnit(values.amount.toString(), decimals),
      },
      {
        onSuccess: (values) => {
          if (values) {
            setTransaction(values);
          } else {
            setErrors("API ERROR - Please try again later");
          }
        },
        onError: (error) => {
          console.log({ error });
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
          Your transaction has been successfully processed <br /> by the Adamik
          API and is now ready for signing.
        </h1>
        <Textarea readOnly value={JSON.stringify(transaction)} />
        <Button onClick={() => onNextStep()} className="w-full">
          Sign your Transaction
        </Button>
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
                  <AssetSelector
                    assets={assets}
                    onSelect={(asset) => {
                      form.setValue("chainId", asset.chainId);
                      form.setValue("senders", asset.address);
                      if (asset.isToken) {
                        form.setValue("mode", TransactionMode.TRANSFER_TOKEN);
                        form.setValue("tokenId", asset.assetId);
                      }
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
            name="recipients"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipients</FormLabel>
                <FormControl>
                  <Input placeholder="Recipient" {...field} />
                </FormControl>
                <FormMessage />
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

          {error && (
            <div className="text-red-500 w-full break-all">{error.message}</div>
          )}

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </Form>
    </>
  );
}
