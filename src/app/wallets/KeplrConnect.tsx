import { useWalletClient } from "@cosmos-kit/react-lite";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";
import { useChainDetails } from "~/hooks/useChainDetails";
import { useTransaction } from "~/hooks/useTransaction";
import { WalletConnectorProps, WalletName } from "./types";

export const KeplrConnect: React.FC<WalletConnectorProps> = ({
  setWalletAddresses,
  transactionPayload,
}) => {
  const { status, client } = useWalletClient("keplr-extension");
  const { toast } = useToast();
  const { data } = useChainDetails(
    transactionPayload?.transaction.plain.chainId
  );
  const { setSignedTransaction } = useTransaction();

  const connect = async () => {
    try {
      if (status === "Done" && client && setWalletAddresses) {
        await client.enable?.([
          "cosmoshub-4",
          "osmosis",
          "dydx-mainnet-1",
          "celestia",
          "axelar-dojo-1",
        ]);
        const address = await client.getAccount?.("cosmoshub-4");
        if (address) {
          setWalletAddresses(
            [address.address],
            ["cosmoshub"],
            WalletName.KEPLR
          );
        }

        const osmoAddress = await client.getAccount?.("osmosis");
        if (osmoAddress) {
          setWalletAddresses(
            [osmoAddress.address],
            ["osmosis"],
            WalletName.KEPLR
          );
        }

        const dydxAddress = await client.getAccount?.("dydx-mainnet-1");
        if (dydxAddress) {
          setWalletAddresses([dydxAddress.address], ["dydx"], WalletName.KEPLR);
        }

        const celestiaAddress = await client.getAccount?.("celestia");
        if (celestiaAddress) {
          setWalletAddresses(
            [celestiaAddress.address],
            ["celestia"],
            WalletName.KEPLR
          );
        }

        const axelarAddress = await client.getAccount?.("axelar-dojo-1");
        if (axelarAddress) {
          setWalletAddresses(
            [axelarAddress.address],
            ["axelar"],
            WalletName.KEPLR
          );
        }
      }
      toast({
        description:
          "Connected to Keplr, please check portfolio page to see your assets",
      });
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  };

  const sign = async () => {
    if (client && data && transactionPayload) {
      const signedTransaction = await client.signAmino?.(
        data?.nativeId,
        transactionPayload.transaction.plain.senders[0],
        transactionPayload.transaction.encoded as any
      );

      setSignedTransaction(signedTransaction?.signature.signature);
    }
  };

  return (
    <div className="relative w-24 h-24">
      <Avatar
        className="cursor-pointer w-24 h-24"
        onClick={transactionPayload ? () => sign() : () => connect()}
      >
        <AvatarImage src={"/wallets/Keplr.svg"} alt={"Keplr"} />
        <AvatarFallback>Keplr</AvatarFallback>
      </Avatar>
    </div>
  );
};
