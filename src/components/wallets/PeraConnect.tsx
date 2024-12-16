import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";
import { Account, WalletConnectorProps, WalletName } from "./types";
import { useCallback } from "react";
import { useTransaction } from "~/hooks/useTransaction";
import { useToast } from "~/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useWallet } from "~/hooks/useWallet";

/**
 * Pera:
 * - Returns more than 1 address
 * - Only valid chain ID for all addresses is 'algorand'
 */
export const PeraConnect: React.FC<WalletConnectorProps> = ({
  transactionPayload,
}) => {
  const { toast } = useToast();
  const { transaction, setTransaction } = useTransaction();
  const { addAddresses } = useWallet();

  const getAddresses = useCallback(async () => {
    const peraWallet = new PeraWalletConnect();

    try {
      let peraAddresses = await peraWallet.reconnectSession();
      if (peraAddresses.length === 0) {
        peraAddresses = await peraWallet.connect();
      }

      const addresses: Account[] = [];
      for (const address of peraAddresses) {
        addresses.push({
          address,
          chainId: "algorand",
          signer: WalletName.PERA,
        });
      }

      addAddresses(addresses);

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
  }, [toast, addAddresses]);

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
            new Uint8Array(Buffer.from(transactionPayload.encoded, "hex"))
          ),
        },
      ],
    ]);

    const signature = Buffer.from(signatureBytes[0]).toString("hex");

    transaction && setTransaction({ ...transaction, signature });
    /*
      toast({
        description: "Transaction failed",
        variant: "destructive",
      });
      */
  }, [setTransaction, toast, transaction, transactionPayload]);

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
