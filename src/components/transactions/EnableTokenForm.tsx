"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ChevronDown } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { TransactionLoading } from "~/app/portfolio/TransactionLoading";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Textarea } from "~/components/ui/textarea";
import { useEncodeTransaction } from "~/hooks/useEncodeTransaction";
import { useTransaction } from "~/hooks/useTransaction";
import { useBroadcastTransaction } from "~/hooks/useBroadcastTransaction";
import { useToast } from "~/components/ui/use-toast";
import { z } from "zod";
import { Asset, TransactionData, TransactionMode } from "~/utils/types";
import { TransactionSuccessModal } from "./TransactionSuccessModal";

const enableTokenFormSchema = z.object({
  tokenCode: z.string().min(1, "Token code is required"),
  issuerAddress: z.string().optional(),
  tokenType: z.enum(["token", "nft"]).default("token"),
});

type EnableTokenFormInput = z.infer<typeof enableTokenFormSchema>;

type EnableTokenFormProps = {
  onNextStep: () => void;
  asset: Asset; // The native asset (XLM or ALGO)
};

export function EnableTokenForm({ onNextStep, asset }: EnableTokenFormProps) {
  const { mutate, isPending, isSuccess } = useEncodeTransaction();
  const { mutate: broadcastTransaction } = useBroadcastTransaction();
  const { toast } = useToast();
  const form = useForm<EnableTokenFormInput>({
    resolver: zodResolver(enableTokenFormSchema),
    defaultValues: {
      tokenCode: "",
      issuerAddress: "",
      tokenType: "token",
    },
  });

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

  const signAndBroadcast = async () => {
    if (!transaction) {
      console.error("No transaction to sign");
      setErrors("No transaction to sign");
      return;
    }

    if (!chainId) {
      console.error("Chain ID is undefined");
      setErrors("Chain ID is undefined. Please try again.");
      return;
    }

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
          if (firstEncoded.hash?.value) {
            transactionHash = String(firstEncoded.hash.value);
          }
          if (firstEncoded.raw?.value) {
            transactionRaw = String(firstEncoded.raw.value);
          }
        }
      } else if (typeof transactionEncoded === "string") {
        transactionRaw = transactionEncoded;
      }

      if (!transactionHash && !transactionRaw) {
        transactionRaw = JSON.stringify(transactionEncoded);
      }

      // For Stellar, we should use the hash for signing
      const isStellar = chainId.includes("stellar");
      const shouldUseHash = isStellar && transactionHash;

      // Sign the transaction
      const response = await fetch(`/api/sodot-proxy/${chainId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // For Stellar, prioritize hash over raw
          transaction: shouldUseHash ? undefined : transactionRaw,
          hash: transactionHash,
          usePrecomputedHash: shouldUseHash,
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

      if (!signature) {
        throw new Error("No signature returned from signing");
      }

      // Create signed transaction
      const signedTransaction = {
        ...transaction,
        signature: signature,
      };

      setTransaction(signedTransaction);

      // Broadcast the transaction
      const transactionWithChainId = {
        ...signedTransaction,
        data: {
          ...signedTransaction.data,
          chainId,
        },
      };

      broadcastTransaction(transactionWithChainId, {
        onSuccess: (response) => {
          if (response.error) {
            const errorMessage =
              response.error.status?.errors?.[0]?.message ||
              "Transaction broadcast failed";
            setErrors(errorMessage);
            toast({
              variant: "destructive",
              title: "Broadcast Failed",
              description: errorMessage,
            });
            setSigning(false);
          } else if (response.hash) {
            setTransactionHash(response.hash);
            toast({
              variant: "default",
              title: "Token Enabled Successfully!",
              description: "The token has been enabled for your account.",
              duration: 3000,
            });
            setShowSuccessModal(true);
            setSigning(false);
          }
        },
        onError: (error) => {
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
    (formInput: EnableTokenFormInput) => {
      console.log("Enabling token:", formInput);

      // Format tokenId based on chain type
      let tokenId: string;
      const isStellar = asset.chainId.includes("stellar");

      if (isStellar) {
        // Stellar format: ASSET_CODE:ISSUER_ADDRESS
        if (!formInput.issuerAddress) {
          setErrors("Issuer address is required for Stellar tokens");
          return;
        }
        tokenId = `${formInput.tokenCode}:${formInput.issuerAddress}`;
      } else {
        // Algorand uses ASA ID directly
        tokenId = formInput.tokenCode;
      }

      const transactionData: TransactionData = {
        mode: TransactionMode.ENABLE_TOKEN,
        chainId: asset.chainId,
        tokenId,
        senderAddress: asset.address,
        format: "json",
        useMaxAmount: false,
        // Note: enableToken doesn't require an amount field
      };

      // Add public key if available
      if (asset.pubKey) {
        transactionData.senderPubKey = asset.pubKey;
      }

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
    [asset, mutate, setChainId, setTransaction, setTransactionHash]
  );

  if (isPending) {
    return <TransactionLoading />;
  }

  if (isSuccess && transaction) {
    return (
      <>
        <h1 className="font-bold text-xl text-center">Enable Token</h1>
        <p className="text-center text-sm text-gray-400 mb-4">
          Review and sign the transaction to enable this token on your account.
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

  const isStellar = asset.chainId.includes("stellar");
  const chainName = isStellar ? "Stellar" : "Algorand";

  // Common Stellar testnet tokens for quick selection
  // Note: These are commonly used test tokens on Stellar testnet
  const stellarTestnetTokens = [
    {
      code: "USDC",
      issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      name: "USD Coin Test",
    },
    {
      code: "SRT",
      issuer: "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B",
      name: "Testnet Reference Token",
    },
    {
      code: "EURT",
      issuer: "GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S",
      name: "Euro Test Token",
    },
  ];

  const handleQuickSelect = (token: (typeof stellarTestnetTokens)[0]) => {
    form.setValue("tokenCode", token.code);
    form.setValue("issuerAddress", token.issuer);
  };

  return (
    <>
      <h1 className="font-bold text-xl text-center">
        Enable Token on {chainName}
      </h1>
      <p className="text-center text-sm text-gray-400 mb-6">
        Enter the token details you want to enable for your {chainName} account.
      </p>

      {isStellar && asset.chainId === "stellar-testnet" && (
        <div className="mb-6 px-4">
          <p className="text-xs text-muted-foreground mb-2">
            Quick select common testnet tokens:
          </p>
          <div className="flex flex-wrap gap-2">
            {stellarTestnetTokens.map((token) => (
              <Badge
                key={token.code}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleQuickSelect(token)}
              >
                {token.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-4">
          <FormField
            control={form.control}
            name="tokenCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isStellar ? "Asset Code" : "ASA ID"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      isStellar ? "e.g., USDC" : "Enter Algorand ASA ID"
                    }
                    {...field}
                  />
                </FormControl>
                {isStellar && (
                  <p className="text-xs text-muted-foreground">
                    The asset code (e.g., USDC, yUSDC, AQUA)
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {isStellar && (
            <FormField
              control={form.control}
              name="issuerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issuer Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    The Stellar address that issued this asset
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {errors && (
            <div className="text-red-500 w-full break-all">{errors}</div>
          )}

          <Button type="submit" className="w-full">
            Enable Token
          </Button>
        </form>
      </Form>
    </>
  );
}
