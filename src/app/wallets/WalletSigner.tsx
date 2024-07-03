"use client";

import { useTransaction } from "~/hooks/useTransaction";
import { MetamaskConnect } from "./MetamaskConnect";
import { KeplrConnect } from "./KeplrConnect";
import { useWallet } from "~/hooks/useWallet";
import { WalletName } from "./types";
import { Rocket } from "lucide-react";
import { Button } from "~/components/ui/button";

export const WalletSigner = ({ onNextStep }: { onNextStep: () => void }) => {
  const { transaction, transactionHash } = useTransaction();
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
      default:
        return null;
    }
  };

  if (transactionHash) {
    return (
      <div className="p-12 py-2 flex flex-col gap-6 items-center">
        <div className="text-center text-xl">
          Transaction successfully broadcasted
        </div>
        <div>
          <Rocket height={32} width={32} />
        </div>
        <div className="break-all">{transactionHash}</div>

        <Button onClick={() => onNextStep()}>Close</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-extrabold text-2xl text-center mb-4">
        Sign with your wallet
      </h1>
      <div className="mb-8 text-center">
        Click on your wallet to start the signing process.
      </div>
      <div className="flex flex-row gap-4">{getSignerComponent()}</div>
    </div>
  );
};
