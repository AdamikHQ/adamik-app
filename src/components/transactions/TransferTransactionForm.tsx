"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
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
import { useBroadcastTransaction } from "~/hooks/useBroadcastTransaction";
import { amountToSmallestUnit } from "~/utils/helper";
import { TransactionFormInput, transactionFormSchema } from "~/utils/schema";
import {
  Asset,
  TransactionData,
  TransactionMode,
  Transaction,
} from "~/utils/types";
import { AmountFormField } from "./fields/AmountFormField";
import { AssetFormField } from "./fields/AssetFormField";
import { RecipientFormField } from "./fields/RecipientFormField";
import { SenderFormField } from "./fields/SenderFormField";
import { useToast } from "~/components/ui/use-toast";
import { TransactionSuccessModal } from "./TransactionSuccessModal";

type TransactionProps = {
  onNextStep: () => void;
  assets: Asset[];
};

// FIXME Some duplicate logic to put in common with ./StakingTransactionForm.tsx

export function TransferTransactionForm({
  onNextStep,
  assets,
}: TransactionProps) {
  const { mutate, isPending, isSuccess } = useEncodeTransaction();
  const { mutate: broadcastTransaction } = useBroadcastTransaction();
  const { toast } = useToast();
  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      mode: TransactionMode.TRANSFER,
      chainId: "",
      tokenId: "",
      sender: "",
      recipient: "",
      amount: undefined,
      useMaxAmount: false,
    },
  });
  const [decimals, setDecimals] = useState<number>(0);
  const {
    chainId,
    transaction,
    setChainId,
    setTransaction,
    setTransactionHash,
  } = useTransaction();
  const [errors, setErrors] = useState("");
  const [signing, setSigning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Add debugging effect to monitor transaction and chainId
  useEffect(() => {
    console.log("Transaction or chainId changed:", {
      transaction: transaction ? { ...transaction } : null,
      chainId,
    });
  }, [transaction, chainId]);

  const signAndBroadcast = async () => {
    if (!transaction) {
      console.error("No transaction to sign");
      setErrors("No transaction to sign");
      return;
    }

    // Use chainId from context instead of from transaction object
    if (!chainId) {
      console.error("Chain ID is undefined in context", {
        transaction,
        contextChainId: chainId,
      });
      setErrors("Chain ID is undefined. Please try again.");
      return;
    }

    console.log("Sign & Broadcast clicked:", {
      transaction: { ...transaction },
      transactionChainId: transaction.data?.chainId,
      contextChainId: chainId,
    });

    setSigning(true);
    setErrors("");

    try {
      // Extract transaction data for signing
      const transactionEncoded = transaction.encoded;

      let transactionHash: string | undefined;
      let transactionRaw: string | undefined;

      if (Array.isArray(transactionEncoded) && transactionEncoded.length > 0) {
        const firstEncoded = transactionEncoded[0];
        if (firstEncoded && typeof firstEncoded === "object") {
          if (
            firstEncoded.hash &&
            typeof firstEncoded.hash === "object" &&
            "value" in firstEncoded.hash
          ) {
            transactionHash = String(firstEncoded.hash.value);
          }
          if (
            firstEncoded.raw &&
            typeof firstEncoded.raw === "object" &&
            "value" in firstEncoded.raw
          ) {
            transactionRaw = String(firstEncoded.raw.value);
          }
        }
      } else if (typeof transactionEncoded === "string") {
        transactionRaw = transactionEncoded;
      }

      if (!transactionHash && !transactionRaw) {
        console.warn(
          "Could not extract hash or raw transaction, using entire payload"
        );
        transactionRaw = JSON.stringify(transactionEncoded);
      }

      console.log("Signing with:", {
        chainId,
        hash: transactionHash,
        rawLength: transactionRaw?.length,
      });

      // Step 1: Sign the transaction
      const response = await fetch(`/api/sodot-proxy/${chainId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction: transactionRaw,
          hash: transactionHash,
          usePrecomputedHash: !!transactionHash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      const signature = data.signature;

      console.log("Transaction signed successfully:", !!signature);

      if (!signature) {
        throw new Error("No signature returned from signing");
      }

      // Step 2: Create signed transaction object
      const signedTransaction = {
        ...transaction,
        signature: signature,
      };

      // Update transaction in context
      setTransaction(signedTransaction);

      // Step 3: Broadcast the transaction
      console.log("Broadcasting transaction with signature");

      // Ensure chainId is included in the data properly
      const transactionWithChainId = {
        ...signedTransaction,
        data: {
          ...signedTransaction.data,
          chainId,
        },
      };

      broadcastTransaction(transactionWithChainId, {
        onSuccess: (response) => {
          console.log("Broadcast response:", response);
          if (response.error) {
            const errorMessage =
              response.error.status?.errors?.[0]?.message ||
              "An unknown error occurred";
            console.error("Broadcast error:", errorMessage);
            setErrors(errorMessage);
            toast({
              variant: "destructive",
              title: "Broadcast Failed",
              description: errorMessage,
            });
          } else if (response.hash) {
            console.log("Transaction hash:", response.hash);
            setTransactionHash(response.hash);

            // Show a toast notification
            toast({
              variant: "default",
              title: "Transaction Successful!",
              description:
                "Your transaction has been successfully signed and broadcasted.",
              duration: 3000,
            });

            // Show the success modal instead of closing
            setShowSuccessModal(true);
          } else {
            console.error("Unexpected broadcast response:", response);
            setErrors("Unexpected response from server");
            toast({
              variant: "destructive",
              title: "Broadcast Failed",
              description: "Unexpected response from server",
            });
          }
          setSigning(false);
        },
        onError: (error) => {
          console.error("Broadcast error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown error occurred";
          setErrors(errorMessage);
          toast({
            variant: "destructive",
            title: "Broadcast Failed",
            description: errorMessage,
          });
          setSigning(false);
        },
      });
    } catch (err) {
      console.error("Signing/broadcasting failed:", err);
      setSigning(false);
      const errorMessage =
        err instanceof Error ? err.message : "Transaction failed";
      setErrors(errorMessage);
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: errorMessage,
      });
    }
  };

  const onSubmit = useCallback(
    (formInput: TransactionFormInput) => {
      console.log("Form submitted with values:", formInput);

      const transactionData: TransactionData = {
        mode: formInput.mode,
        chainId: formInput.chainId,
        tokenId: formInput.tokenId,
        senderAddress: formInput.sender,
        recipientAddress: formInput.recipient ? formInput.recipient : "",
        useMaxAmount: formInput.useMaxAmount,
        format: "json", // FIXME Not always the default, should come from chains config
      };

      console.log(
        "Preparing transaction data with chainId:",
        formInput.chainId
      );

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
            console.log("Transaction encoded successfully:", response);
            if (response?.status?.errors?.length) {
              setErrors(response.status.errors[0].message);
            } else {
              console.log("Setting chainId:", response.chainId);
              setChainId(response.chainId);
              setTransaction(response.transaction);
            }
          } else {
            setErrors("API ERROR - Please try again later");
          }
        },
        onError: (error) => {
          console.error("Transaction encoding error:", error);
          setChainId(undefined);
          setTransaction(undefined);
          setTransactionHash(undefined);
          setErrors(error.message);
        },
      });
    },
    [assets, decimals, mutate, setChainId, setTransaction, setTransactionHash]
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
          Review your transaction details before signing. After signing, the
          transaction will be automatically broadcasted.
        </p>
        <div className="w-full mt-8">
          <Button
            className="w-full"
            disabled={signing}
            onClick={signAndBroadcast}
          >
            {signing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing & Broadcasting...
              </>
            ) : (
              "Sign & Broadcast"
            )}
          </Button>
        </div>
        {errors && (
          <div className="text-red-500 w-full break-all mt-4 text-center">
            {errors}
          </div>
        )}
        <Collapsible>
          <CollapsibleTrigger className="text-xs text-gray-400 text-center mx-auto flex items-center justify-center mt-4 hover:text-gray-500 transition-colors">
            <ChevronDown className="mr-1" size={12} />
            Show unsigned transaction
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Textarea
              readOnly
              value={JSON.stringify(transaction)}
              className="h-32 text-xs text-gray-500 mt-2"
            />
          </CollapsibleContent>
        </Collapsible>
        <TransactionSuccessModal
          open={showSuccessModal}
          setOpen={setShowSuccessModal}
          onClose={onNextStep}
        />
      </>
    );
  }

  return (
    <>
      <h1 className="font-bold text-xl text-center">Transfer</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-4">
          <AssetFormField
            form={form}
            assets={assets}
            setDecimals={setDecimals}
            initialMode={TransactionMode.TRANSFER}
          />

          <SenderFormField form={form} />

          <RecipientFormField form={form} />

          <AmountFormField form={form} />

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
