"use client";

import { Rocket } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useTransaction } from "~/hooks/useTransaction";
import { useWallet } from "~/hooks/useWallet";
import { BroadcastModal } from "./BroadcastModal";
import { KeplrConnect } from "./KeplrConnect";
import { MetamaskConnect } from "./MetamaskConnect";
import { PeraConnect } from "./PeraConnect";
import { WalletName } from "./types";
import { Modal } from "~/components/ui/modal"; // Import the Modal component
import { UniSatConnect } from "./UniSatConnect";

export const WalletSigner = ({ onNextStep }: { onNextStep: () => void }) => {
  const { transaction, transactionHash, setTransactionHash } = useTransaction();
  const { addresses } = useWallet();

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
          <div className="p-12 py-2 flex flex-col gap-6 items-center">
            <h1 className="font-extrabold text-2xl text-center mb-4">
              Transaction successfully broadcasted
            </h1>
            <div>
              <Rocket height={32} width={32} />
            </div>
            <div className="flex gap-4">
              <Button onClick={handleCopyToClipboard}>Copy Tx Hash</Button>
              <Button onClick={handleClose}>Close</Button>
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
