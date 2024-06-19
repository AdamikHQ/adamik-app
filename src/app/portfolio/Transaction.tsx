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

type TransactionProps = {
  onNextStep: () => void;
  assets: Asset[];
};

export function Transaction({ onNextStep, assets }: TransactionProps) {
  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      mode: TransactionMode.TRANSFER,
      chainId: "",
      senders: "",
      recipients: "",
      amount: 0,
      useMaxAmount: false,
    },
  });

  function onSubmit(values: TransactionFormInput) {
    onNextStep();
  }

  return (
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
                <Input placeholder="Sender" {...field} />
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

        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>
    </Form>
  );
}
