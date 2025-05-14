"use client";

import { Rocket, Copy, ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { toast } from "~/components/ui/use-toast";
import { useTransaction } from "~/hooks/useTransaction";
import { Modal } from "~/components/ui/modal";
import Link from "next/link";

interface TransactionSuccessModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
}

export const TransactionSuccessModal = ({
  open,
  setOpen,
  onClose,
}: TransactionSuccessModalProps) => {
  const {
    chainId,
    transactionHash,
    setChainId,
    setTransaction,
    setTransactionHash,
  } = useTransaction();

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
    onClose();
    setChainId(undefined);
    setTransaction(undefined);
    setTransactionHash(undefined);

    // Refresh the page after a short delay to show updated balances
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <Modal
      open={open}
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
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      }
    />
  );
};
