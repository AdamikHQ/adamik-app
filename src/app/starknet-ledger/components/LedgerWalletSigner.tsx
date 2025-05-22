"use client";

import { Copy, ExternalLink, Rocket } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import { encode } from "starknet";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { Tooltip } from "~/components/ui/tooltip";
import { toast } from "~/components/ui/use-toast";
import { BroadcastModal } from "~/components/wallets/BroadcastModal";
import { PATH } from "~/hooks/useLedger";
import { useTransaction } from "~/hooks/useTransaction";
import { useLedgerContext } from "~/providers/LedgerProvider";
import { Transaction, TransactionMode } from "~/utils/types";

export const LedgerWalletSigner = ({
  onNextStep,
  mode,
}: {
  onNextStep: () => void;
  mode: TransactionMode;
}) => {
  const {
    chainId,
    transaction,
    transactionHash,
    setChainId,
    setTransaction,
    setTransactionHash,
  } = useTransaction();
  const { starknetClient } = useLedgerContext();

  const sign = useCallback(
    async (transactionPayload: Transaction) => {
      console.log("sign", transactionPayload);
      console.log("state.starknetClient", starknetClient);
      if (!starknetClient || !transactionPayload) return;

      let signature;
      const payload = JSON.parse(
        transactionPayload.encoded[0].raw?.value || "{}"
      );
      if (transactionPayload.data.mode === TransactionMode.DEPLOY_ACCOUNT) {
        signature = await starknetClient.signDeployAccount(PATH, payload);
      }

      if (transactionPayload.data.mode === TransactionMode.TRANSFER) {
        const transferPayload = JSON.parse(
          transactionPayload.encoded[0].raw?.value || "{}"
        );

        console.log("transferPayload", transferPayload);
        signature = await starknetClient.signTx(
          PATH,
          transferPayload.calls,
          transferPayload.details
        );
      }

      console.log("signature", signature);
      const r = Buffer.from(signature.r).toString("hex");
      const s = Buffer.from(signature.s).toString("hex");

      signature = [signature.r, signature.s].map((bytes) =>
        encode.addHexPrefix(encode.buf2hex(bytes))
      );

      setTransaction({
        ...transactionPayload,
        signature: signature.join(""),
      });
      return signature;
    },
    [starknetClient]
  );

  const handleCopyToClipboard = () => {
    if (transactionHash) {
      navigator.clipboard.writeText(transactionHash).then(
        () => {
          toast({
            title: "Copied!",
            description: "Transaction hash copied to clipboard",
            duration: 3000,
          });
        },
        (err) => {
          console.error("Could not copy text: ", err);
          toast({
            title: "Error",
            description: "Failed to copy transaction hash",
            variant: "destructive",
            duration: 3000,
          });
        }
      );
    }
  };

  const handleClose = () => {
    onNextStep();
    setChainId(undefined);
    setTransaction(undefined);
    setTransactionHash(undefined);
  };

  if (transactionHash) {
    return (
      <Modal
        open={true}
        setOpen={() => handleClose()}
        modalContent={
          <div className="p-6 flex flex-col gap-6 items-center text-center max-w-md mx-auto">
            <h1 className="font-extrabold text-2xl">
              Transaction successfully broadcasted
            </h1>
            <Rocket className="h-12 w-12 text-green-500" />
            <div className="flex items-center w-full bg-muted p-3 rounded text-sm">
              <span className="font-mono text-foreground truncate flex-1 pr-2">
                {transactionHash}
              </span>
              <Tooltip text="Copy transaction hash">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyToClipboard}
                  className="text-foreground hover:bg-background flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
            <div className="flex gap-4 w-full">
              <Link
                href={`/data?chainId=${chainId}&transactionId=${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full">
                  View Transaction <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        }
      />
    );
  }

  if (transaction?.signature) {
    return <BroadcastModal onNextStep={onNextStep} />;
  }

  if (!transaction) {
    return null;
  }

  return (
    <div>
      <h1 className="font-extrabold text-2xl text-center mb-4">Sign</h1>
      <div className="mb-8 text-center">
        Please verify your transaction before approving
      </div>
      <div className="flex flex-row gap-4">
        <Button variant="outline" onClick={() => sign(transaction)}>
          Sign with your Nano
        </Button>
      </div>
    </div>
  );
};
