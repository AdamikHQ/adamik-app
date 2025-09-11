"use client";

import { Rocket, Copy, ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { toast } from "~/components/ui/use-toast";
import { useTransaction } from "~/hooks/useTransaction";
import { useWallet } from "~/hooks/useWallet";
import { WalletName } from "./types";
import { Modal } from "~/components/ui/modal";
import { SignerConnect } from "./SignerConnect";
import { SignerFactory } from "~/signers/SignerFactory";
import { SignerType } from "~/signers/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConnectWallet } from "../../app/portfolio/ConnectWallet";
import { useEffect } from "react";

export const WalletSigner = ({ onNextStep }: { onNextStep: () => void }) => {
  const {
    chainId,
    transaction,
    transactionHash,
    setChainId,
    setTransaction,
    setTransactionHash,
  } = useTransaction();
  const { addresses: accounts, isShowroom, setWalletMenuOpen } = useWallet();
  const router = useRouter();

  const signer = accounts.find(
    (account) =>
      account.chainId === chainId &&
      account.address === transaction?.data.senderAddress
  );

  const getSignerComponent = () => {
    // Get the selected signer type from settings
    const signerType = SignerFactory.getSelectedSignerType();
    
    // Check if the account uses a supported signer
    if (signer?.signer === WalletName.SODOT || signer?.signer === WalletName.IOFINNET) {
      // Use the generic SignerConnect component that works with any signer
      return (
        <SignerConnect chainId={chainId} transactionPayload={transaction} />
      );
    }
    
    // No supported signer found
    return (
      <div className="text-center text-muted-foreground">
        No compatible signer found for this transaction.
        <br />
        Please connect a wallet using {signerType === SignerType.SODOT ? "Sodot" : "IoFinnet"} signer.
      </div>
    );
  };

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

  if (isShowroom) {
    return (
      <ConnectWallet
        onNextStep={() => {
          onNextStep();
          setWalletMenuOpen(true);
        }}
      />
    );
  }

  return (
    <div className="p-4 flex flex-col items-center">{getSignerComponent()}</div>
  );
};
