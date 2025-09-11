/**
 * SIGNER-AGNOSTIC connect component for transaction signing
 * Works with any signer that implements the BaseSigner interface
 */

import React, { useCallback, useState, useEffect } from "react";
import { useToast } from "~/components/ui/use-toast";
import { useWallet } from "~/hooks/useWallet";
import { WalletConnectorProps, WalletName } from "./types";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { useChains } from "~/hooks/useChains";
import { useTransaction } from "~/hooks/useTransaction";
import { useBroadcastTransaction } from "~/hooks/useBroadcastTransaction";
import { SignerFactory } from "~/signers/SignerFactory";
import { SignerType } from "~/signers/types";

type SignerConnectProps = WalletConnectorProps & {
  buttonClassName?: string;
};

export const SignerConnect: React.FC<SignerConnectProps> = ({
  chainId: providedChainId,
  transactionPayload,
  buttonClassName,
}) => {
  const { toast } = useToast();
  const { setTransaction, setTransactionHash } = useTransaction();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: chains } = useChains();
  const { mutate: broadcastTransaction } = useBroadcastTransaction();
  
  // Get the selected signer type from settings
  const signerType = SignerFactory.getSelectedSignerType();
  const signerName = signerType === SignerType.SODOT ? "Sodot" : "IoFinnet";

  const autoBroadcastTransaction = useCallback(
    (signedTransaction: any, chainId: string) => {
      // Merge chainId into transaction (FIXME: should be refactored)
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
              response.error.status.errors[0]?.message ||
              "An unknown error occurred";
            toast({
              variant: "destructive",
              title: "Broadcast Failed",
              description: errorMessage,
            });
          } else if (response.hash) {
            setTransactionHash(response.hash);
            toast({
              description:
                "Transaction has been successfully signed and broadcasted. Your balance will be updated in a few moments",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Broadcast Failed",
              description: "Unexpected response from server",
            });
          }
        },
        onError: (error) => {
          console.error("Broadcast error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown error occurred";
          toast({
            variant: "destructive",
            title: "Broadcast Failed",
            description: errorMessage,
          });
        },
      });
    },
    [broadcastTransaction, setTransactionHash, toast]
  );

  const sign = useCallback(async () => {
    if (!transactionPayload || !chains || !providedChainId) return;

    setLoading(true);

    try {
      // Extract transaction data for signing
      const transactionEncoded = transactionPayload.encoded;

      // Get the first encoded format's hash and raw value
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

      // Determine the correct API endpoint based on signer type
      let signEndpoint: string;
      let signPayload: any;

      if (signerType === SignerType.SODOT) {
        // Sodot signing endpoint
        signEndpoint = `/api/sodot-proxy/${providedChainId}/sign`;
        signPayload = {
          transaction: transactionRaw,
          hash: transactionHash,
          usePrecomputedHash: !!transactionHash,
        };
      } else {
        // IoFinnet signing endpoint
        const chainConfig = chains[providedChainId];
        if (!chainConfig) {
          throw new Error(`Chain ${providedChainId} not found`);
        }
        
        signEndpoint = `/api/iofinnet-proxy/sign-transaction`;
        signPayload = {
          chain: providedChainId,
          message: transactionHash || transactionRaw,
          signerSpec: chainConfig.signerSpec,
        };
      }

      // Call the signing API
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

      console.log(`Transaction signed with ${signerName}:`, signature);

      // Update the transaction with the signature
      if (transactionPayload && signature) {
        const signedTransaction = {
          ...transactionPayload,
          signature: signature,
        };

        // Use setTimeout to break the render cycle
        setTimeout(() => {
          setTransaction(signedTransaction);
          console.log("Updated transaction with signature:", signedTransaction);

          // Automatically broadcast the transaction
          autoBroadcastTransaction(signedTransaction, providedChainId);
        }, 0);
      }

      toast({
        description: `Transaction signed successfully with ${signerName}`,
      });
    } catch (err) {
      console.warn(`Failed to sign with ${signerName}:`, err);
      toast({
        description: err instanceof Error ? err.message : "Transaction failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    providedChainId,
    transactionPayload,
    toast,
    chains,
    setTransaction,
    autoBroadcastTransaction,
    signerType,
    signerName,
  ]);

  if (error) {
    return (
      <Button className="w-full" disabled>
        Error: {error}
      </Button>
    );
  }

  if (!chains) {
    return (
      <Button className="w-full" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading chain info...
      </Button>
    );
  }

  // Show sign button for transaction signing
  if (providedChainId && transactionPayload) {
    return (
      <Button
        className={buttonClassName || "w-full"}
        onClick={() => sign()}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing with {signerName}...
          </>
        ) : (
          `Sign & Broadcast with ${signerName}`
        )}
      </Button>
    );
  }

  // No transaction to sign
  return null;
};