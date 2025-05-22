"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { TransactionLoading } from "~/app/portfolio/TransactionLoading";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Form } from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { useEncodeTransaction } from "~/hooks/useEncodeTransaction";
import { useTransaction } from "~/hooks/useTransaction";
import { TransactionFormInput, transactionFormSchema } from "~/utils/schema";
import { TransactionData, TransactionMode } from "~/utils/types";
import { InputFormField } from "./fields/InputFormField";
import { TypeFormField } from "./fields/TypeFormField";

type DeployAccountTransactionProps = {
  onNextStep: () => void;
  pubKey: string;
  chainId: string;
};

export function DeployAccountTransactionForm({
  onNextStep,
  pubKey,
  chainId,
}: DeployAccountTransactionProps) {
  const { mutate, isPending, isSuccess } = useEncodeTransaction();
  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      mode: TransactionMode.DEPLOY_ACCOUNT,
      senderPubKey: pubKey,
      chainId: chainId,
      type: "argentx",
    },
  });
  const { transaction, setChainId, setTransaction, setTransactionHash } =
    useTransaction();
  const [errors, setErrors] = useState("");

  const onSubmit = useCallback(
    (formInput: TransactionFormInput) => {
      const transactionData: TransactionData = {
        mode: TransactionMode.DEPLOY_ACCOUNT,
        chainId: formInput.chainId,
        senderPubKey: formInput.senderPubKey,
        type: formInput.type,
      };

      console.log(transactionData);

      mutate(transactionData, {
        onSuccess: (response) => {
          setChainId(undefined);
          setTransaction(undefined);
          setTransactionHash(undefined);
          if (response) {
            if (response?.status?.errors?.length) {
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
    [pubKey, mutate, setChainId, setTransaction, setTransactionHash]
  );

  if (isPending) {
    return <TransactionLoading />;
  }

  if (isSuccess && transaction) {
    return (
      <>
        <h1 className="font-bold text-xl text-center">
          Your account deployment is ready
        </h1>
        <p className="text-center text-sm text-gray-400">
          Adamik has prepared your account deployment transaction. <br />
          Review the details before signing
        </p>
        <Button onClick={() => onNextStep()} className="w-full mt-8">
          Sign your Transaction
        </Button>
        <Collapsible>
          <CollapsibleTrigger className="text-sm text-gray-500 text-center mx-auto flex items-center justify-center">
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
      <h1 className="font-bold text-xl text-center">Deploy Account</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-4">
          <TypeFormField form={form} />

          <InputFormField form={form} fieldName="senderPubKey" label="Pubkey" />
          <InputFormField form={form} fieldName="chainId" label="Chain ID" />

          {errors && (
            <div className="text-red-500 w-full break-all">{errors}</div>
          )}

          <Button type="submit" className="w-full">
            Deploy Account
          </Button>
        </form>
      </Form>
    </>
  );
}
