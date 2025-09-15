/**
 * SIGNER-AGNOSTIC connect component for transaction signing
 * Works with any signer that implements the BaseSigner interface
 */

import React, { useCallback, useState, useEffect } from "react";
import { useToast } from "~/components/ui/use-toast";
import { useWallet } from "~/hooks/useWallet";
import { WalletConnectorProps, WalletName } from "./types";
import { Button } from "~/components/ui/button";
import { Loader2, Smartphone } from "lucide-react";
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
  const [waitingForMobileApproval, setWaitingForMobileApproval] = useState(false);
  const { data: chains } = useChains();
  const { mutate: broadcastTransaction } = useBroadcastTransaction();
  
  // Get the selected signer type from settings
  const signerType = SignerFactory.getSelectedSignerType();
  const signerName = signerType === SignerType.SODOT ? "Sodot" : 
                     signerType === SignerType.IOFINNET ? "IoFinnet" :
                     signerType === SignerType.TURNKEY ? "Turnkey" :
                     signerType === SignerType.BLOCKDAEMON ? "BlockDaemon" : "Unknown";

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
      } else if (signerType === SignerType.IOFINNET) {
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
      } else if (signerType === SignerType.TURNKEY) {
        // Turnkey signing endpoint
        const chainConfig = chains[providedChainId];
        if (!chainConfig) {
          throw new Error(`Chain ${providedChainId} not found`);
        }
        
        // Get the public key for this chain
        const pubKey = await SignerFactory.getChainPubkey(providedChainId, SignerType.TURNKEY);
        
        // Determine whether to sign hash or raw transaction
        const isHashSigning = !!transactionHash && chainConfig.signerSpec?.curve === "ed25519";
        
        signEndpoint = isHashSigning ? `/api/turnkey-proxy/sign-hash` : `/api/turnkey-proxy/sign-transaction`;
        signPayload = {
          chainId: providedChainId,
          encodedMessage: isHashSigning ? transactionHash : transactionRaw,
          hash: isHashSigning ? transactionHash : undefined,
          pubKey,
          signerSpec: chainConfig.signerSpec,
        };
      } else {
        throw new Error(`Unsupported signer type: ${signerType}`);
      }

      // Set waiting state for IoFinnet
      if (signerType === SignerType.IOFINNET) {
        setWaitingForMobileApproval(true);
      }
      
      // Call the signing API with extended timeout for IoFinnet
      // IoFinnet requires mobile approval which can take up to 10 minutes
      const controller = new AbortController();
      const timeoutMs = signerType === SignerType.IOFINNET ? 11 * 60 * 1000 : 2 * 60 * 1000; // 11 min for IoFinnet, 2 min for others
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(signEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signPayload),
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
        // Clear waiting state
        if (signerType === SignerType.IOFINNET) {
          setWaitingForMobileApproval(false);
        }
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

      // Clear waiting state on success
      setWaitingForMobileApproval(false);
      toast({
        description: `Transaction signed successfully with ${signerName}`,
      });
    } catch (err: any) {
      console.warn(`Failed to sign with ${signerName}:`, err);
      setWaitingForMobileApproval(false);
      
      // Handle timeout specifically for IoFinnet
      if (err.name === 'AbortError' && signerType === SignerType.IOFINNET) {
        toast({
          title: "Signature timeout",
          description: "The signature request timed out. Please try again and approve the transaction on your mobile device within 10 minutes.",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({
          title: "Signature failed",
          description: err instanceof Error ? err.message : "Transaction failed",
          variant: "destructive",
        });
      }
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

  // Show sign button or waiting state for transaction signing
  if (providedChainId && transactionPayload) {
    // Show IoFinnet waiting state
    if (waitingForMobileApproval && signerType === SignerType.IOFINNET) {
      return (
        <div className="w-full p-6 flex flex-col gap-4 items-center text-center">
          <Smartphone className="h-12 w-12 text-blue-500 animate-pulse" />
          <div className="space-y-2">
            <p className="font-semibold text-lg">
              Approve on IoFinnet Mobile
            </p>
            <p className="text-sm text-muted-foreground">
              Please check your mobile device and approve the transaction.
            </p>
            <p className="text-xs text-muted-foreground">
              This may take up to 10 minutes.
            </p>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <p className="text-xs text-muted-foreground">
            Waiting for approval...
          </p>
        </div>
      );
    }
    
    // Show regular button
    return (
      <Button
        className={buttonClassName || "w-full"}
        onClick={() => sign()}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {signerType === SignerType.IOFINNET 
              ? "Sending to mobile..." 
              : `Signing with ${signerName}...`}
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