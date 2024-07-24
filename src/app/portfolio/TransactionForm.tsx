"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";
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
import { useEncodeTransaction } from "~/hooks/useEncodeTransaction";
import { amountToSmallestUnit } from "~/utils/helper";
import { TransactionFormInput, transactionFormSchema } from "~/utils/schema";
import { Asset, PlainTransaction, TransactionMode } from "~/utils/types";
import { AssetsSelector } from "./AssetsSelector";
import { TransactionLoading } from "./TransactionLoading";

type TransactionProps = {
  onNextStep: () => void;
  assets: Asset[];
};

// FIXME Some duplicate logic to put in common with src/app/stake/TransactionForm.tsx

export function TransactionForm({ onNextStep, assets }: TransactionProps) {
  const { mutate, isPending, isSuccess } = useEncodeTransaction();
  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      mode: TransactionMode.TRANSFER,
      chainId: "",
      tokenId: "",
      senders: "",
      recipients: "",
      amount: undefined,
      useMaxAmount: false,
    },
  });
  const [decimals, setDecimals] = useState<number>(0);
  const { transaction, setTransaction, setTransactionHash } = useTransaction();
  const [errors, setErrors] = useState("");

  const onSubmit = useCallback(
    (formInput: TransactionFormInput) => {
      const plainTransaction: PlainTransaction = {
        mode: formInput.mode,
        chainId: formInput.chainId,
        tokenId: formInput.tokenId,
        recipients: formInput.recipients ? [formInput.recipients] : [],
        senders: [formInput.senders],
        useMaxAmount: formInput.useMaxAmount,
        format: "json", // FIXME Not always the default, should come from chains config
      };

      if (formInput.amount && !formInput.useMaxAmount) {
        plainTransaction.amount = amountToSmallestUnit(
          formInput.amount.toString(),
          decimals
        );
      }

      // FIXME Hack to be able to provide the pubKey, probably better to refacto
      const pubKey = assets.find(
        (asset) => asset.address === formInput.senders
      )?.pubKey;

      if (pubKey) {
        plainTransaction.params = {
          pubKey,
        };
      }

      mutate(plainTransaction, {
        onSuccess: (settledTransaction) => {
          setTransaction(undefined);
          setTransactionHash(undefined);
          if (settledTransaction) {
            if (
              settledTransaction.status.errors &&
              settledTransaction.status.errors.length > 0
            ) {
              setErrors(settledTransaction.status.errors[0].message);
            } else {
              setTransaction(settledTransaction);
            }
          } else {
            setErrors("API ERROR - Please try again later");
          }
        },
        onError: (error) => {
          setTransaction(undefined);
          setTransactionHash(undefined);
          setErrors(error.message);
        },
      });
    },
    [assets, decimals, mutate, setTransaction, setTransactionHash]
  );

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
                      if (asset.isToken) {
                        form.setValue("mode", TransactionMode.TRANSFER_TOKEN);
                        form.setValue(
                          "tokenId",
                          asset.contractAddress || asset.assetId
                        );
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
