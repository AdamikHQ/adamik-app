"use client";

import { Rocket, Copy, ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { toast } from "~/components/ui/use-toast";
import { useTransaction } from "~/hooks/useTransaction";
import { useWallet } from "~/hooks/useWallet";
import { BroadcastModal } from "./BroadcastModal";
import { KeplrConnect } from "./KeplrConnect";
import { MetamaskConnect } from "./MetamaskConnect";
import { PeraConnect } from "./PeraConnect";
import { WalletName } from "./types";
import { Modal } from "~/components/ui/modal";
import { UniSatConnect } from "./UniSatConnect";
import { LitescribeConnect } from "./LitescribeConnect";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export const WalletSigner = ({ onNextStep }: { onNextStep: () => void }) => {
  const { transaction, transactionHash, setTransactionHash } = useTransaction();
  const { addresses } = useWallet();
  const router = useRouter();
  const [chainId, setChainId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (transaction?.data?.chainId) {
      setChainId(transaction.data.chainId);
    }
  }, [transaction]);

  const signer = addresses.find(
    (address) =>
      address.chainId === transaction?.data.chainId &&
      address.address === transaction?.data.sender
  );

  const getSignerComponent = () => {
    switch (signer?.signer) {
      case WalletName.KEPLR:
        return <KeplrConnect transactionPayload={transaction} />;
      case WalletName.METAMASK:
        return <MetamaskConnect transactionPayload={transaction} />;
      case WalletName.PERA:
        return <PeraConnect transactionPayload={transaction} />;
      case WalletName.UNISAT:
        return <UniSatConnect transactionPayload={transaction} />;
      case WalletName.LITESCRIBE:
        return <LitescribeConnect transactionPayload={transaction} />;
      default:
        return null;
    }
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

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
  };

  const handleViewTx = () => {
    if (transactionHash && chainId) {
      const url = `/data?chainId=${chainId}&transactionId=${transactionHash}`;
      router.push(url);
    } else {
      console.error("Missing transactionHash or chainId", {
        transactionHash,
        chainId,
      });
    }
  };

  const handleClose = () => {
    onNextStep();
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

  return (
    <div>
      <h1 className="font-extrabold text-2xl text-center mb-4">
        Sign with your wallet
      </h1>
      <div className="mb-8 text-center">
        Please verify your transaction before approving
      </div>
      <div className="flex flex-row gap-4">{getSignerComponent()}</div>
    </div>
  );
};
