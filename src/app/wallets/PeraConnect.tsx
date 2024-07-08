import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";
import { WalletConnectorProps, WalletName } from "./types";
import { useCallback, useMemo } from "react";
import { useTransaction } from "~/hooks/useTransaction";
import { useToast } from "~/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

export const PeraConnect: React.FC<WalletConnectorProps> = ({
  setWalletAddresses,
  transactionPayload,
}) => {
  const { toast } = useToast();
  const { setSignedTransaction } = useTransaction();

  const getAddresses = useCallback(async () => {
    const peraWallet = new PeraWalletConnect();

    try {
      let addresses = await peraWallet.reconnectSession();
      if (addresses.length === 0) {
        addresses = await peraWallet.connect();
      }

      setWalletAddresses &&
        setWalletAddresses(addresses, ["algorand"], WalletName.PERA);

      toast({
        description:
          "Connected to Pera Wallet, please check portfolio page to see your assets",
      });
    } catch (e) {
      toast({
        description:
          "Failed to connect to Pera Wallet, verify if you allow connectivity",
        variant: "destructive",
      });
      peraWallet?.disconnect();
      throw e;
    }
  }, [toast, setWalletAddresses]);

  const sign = useCallback(async () => {
    if (!transactionPayload) {
      return;
    }

    const peraWallet = new PeraWalletConnect();

    try {
      (await peraWallet.reconnectSession()) || (await peraWallet.connect());
    } catch (e) {
      toast({
        description:
          "Failed to connect to Pera Wallet, verify if you allow connectivity",
        variant: "destructive",
      });
      peraWallet?.disconnect();
      throw e;
    }

    const signatureBytes = await peraWallet.signTransaction([
      [
        {
          // FIXME: The app shouldn't have to use a chain SDK, we could provide an Adamik SDK instead
          txn: algosdk.decodeUnsignedTransaction(
            new Uint8Array(
              Buffer.from(transactionPayload.transaction.encoded, "hex")
            )
          ),
        },
      ],
    ]);

    const signature = Buffer.from(signatureBytes[0]).toString("hex");

    setSignedTransaction(signature);
    /*
      toast({
        description: "Transaction failed",
        variant: "destructive",
      });
      */
  }, [setSignedTransaction, toast, transactionPayload]);

  return (
    <div className="relative w-24 h-24">
      <Avatar
        className="cursor-pointer w-24 h-24"
        onClick={transactionPayload ? () => sign() : () => getAddresses()}
      >
        <AvatarImage src={"/wallets/Pera.svg"} alt={"pera"} />
        <AvatarFallback>Pera Wallet</AvatarFallback>
      </Avatar>
    </div>
  );
};
