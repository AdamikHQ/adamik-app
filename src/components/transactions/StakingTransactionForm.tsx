"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState, useEffect } from "react";
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
import { SodotConnect } from "~/components/wallets/SodotConnect";
import { useWallet } from "~/hooks/useWallet";
import { useToast } from "~/components/ui/use-toast";
import { useBroadcastTransaction } from "~/hooks/useBroadcastTransaction";
import { TransactionSuccessModal } from "./TransactionSuccessModal";
import { SignerFactory } from "~/signers/SignerFactory";
import { SignerType } from "~/signers/types";
import { getChains } from "~/api/adamik/chains";
import { IoFinnetApprovalModal } from "~/components/modals/IoFinnetApprovalModal";
import { TransactionVerification } from "./TransactionVerification";

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
  const { addresses: accounts } = useWallet();
  const { toast } = useToast();
  const { mutate: broadcastTransaction } = useBroadcastTransaction();
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
  const {
    chainId,
    transaction,
    setChainId,
    setTransaction,
    setTransactionHash,
  } = useTransaction();
  const [errors, setErrors] = useState("");
  const [selectedStakingPosition, setSelectedStakingPosition] = useState<
    StakingPosition | undefined
  >();
  const [signing, setSigning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showIoFinnetApproval, setShowIoFinnetApproval] = useState(false);
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

  // Add debugging effect to monitor transaction and chainId
  useEffect(() => {
    console.log("Staking: Transaction or chainId changed:", {
      transaction: transaction ? { ...transaction } : null,
      chainId,
    });
  }, [transaction, chainId]);

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
        stakeId: formInput.stakeId ?? "",
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

  // Function to handle signing and broadcasting
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

      // Get the selected signer type from settings
      const signerType = SignerFactory.getSelectedSignerType();

      // Determine the correct API endpoint based on signer type
      let signEndpoint: string;
      let signPayload: any;

      if (signerType === SignerType.SODOT) {
        // Sodot signing endpoint
        signEndpoint = `/api/sodot-proxy/${chainId}/sign`;
        signPayload = {
          transaction: transactionRaw,
          hash: transactionHash,
          usePrecomputedHash: !!transactionHash,
        };
      } else {
        // IoFinnet signing endpoint
        // Get chain config for signerSpec
        const chains = await getChains();
        const chainConfig = chains?.[chainId];
        if (!chainConfig) {
          throw new Error(`Chain ${chainId} not found`);
        }

        signEndpoint = `/api/iofinnet-proxy/sign-transaction`;
        signPayload = {
          chain: chainId,
          message: transactionRaw,
          signerSpec: chainConfig.signerSpec,
        };

        // Show IoFinnet approval modal
        setShowIoFinnetApproval(true);
      }

      // Step 1: Sign the transaction
      const response = await fetch(signEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      const signature = data.signature;

      // Hide IoFinnet approval modal if it was shown
      if (signerType === SignerType.IOFINNET) {
        setShowIoFinnetApproval(false);
      }

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
          Review and sign to broadcast your transaction
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
        <TransactionVerification
          apiResponse={{
            chainId: chainId!,
            transaction,
          }}
        />
        <TransactionSuccessModal
          open={showSuccessModal}
          setOpen={setShowSuccessModal}
          onClose={onNextStep}
        />
        <IoFinnetApprovalModal open={showIoFinnetApproval} chainId={chainId} />
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
