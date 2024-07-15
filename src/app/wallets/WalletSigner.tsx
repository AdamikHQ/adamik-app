"use client";

import { Rocket } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useTransaction } from "~/hooks/useTransaction";
import { useWallet } from "~/hooks/useWallet";
import { Broadcast } from "./Broadcast";
import { KeplrConnect } from "./KeplrConnect";
import { MetamaskConnect } from "./MetamaskConnect";
import { PeraConnect } from "./PeraConnect";
import { WalletName } from "./types";

export const WalletSigner = ({ onNextStep }: { onNextStep: () => void }) => {
  const {
    transaction,
    transactionHash,
    setTransactionHash,
    signedTransaction,
  } = useTransaction();
  const { addresses } = useWallet();

  const signer = addresses.find(
    (address) =>
      address.chainId === transaction?.transaction.plain.chainId &&
      address.address === transaction?.transaction.plain.senders[0]
  );

  const getSignerComponent = () => {
    switch (signer?.signer) {
      case WalletName.KEPLR:
        return <KeplrConnect transactionPayload={transaction} />;
      case WalletName.METAMASK:
        return <MetamaskConnect transactionPayload={transaction} />;
      case WalletName.PERA:
        return <PeraConnect transactionPayload={transaction} />;
      default:
        return null;
    }
  };

  const handleCopyToClipboard = () => {
    if (transactionHash) {
      navigator.clipboard.writeText(transactionHash).then(
        () => {
          alert(`Transaction hash copied to clipboard: ${transactionHash}`);
        },
        (err) => {
          console.error("Could not copy text: ", err);
        }
      );
    }
  };

  if (transactionHash) {
    return (
      <div className="p-12 py-2 flex flex-col gap-6 items-center">
        <h1 className="font-extrabold text-2xl text-center mb-4">
          Transaction successfully broadcasted
        </h1>
        <div>
          <Rocket height={32} width={32} />
        </div>
        <div className="flex gap-4">
          <Button onClick={handleCopyToClipboard}>Copy Tx Hash</Button>
          <Button
            onClick={() => {
              onNextStep();
              setTransactionHash(undefined);
            }}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (signedTransaction) {
    return <Broadcast onNextStep={() => onNextStep()} />;
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
