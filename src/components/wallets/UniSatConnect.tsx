import { useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";
import { useTransaction } from "~/hooks/useTransaction";
import { useWallet } from "~/hooks/useWallet";
import { Account, WalletConnectorProps, WalletName } from "./types";

export const UniSatConnect: React.FC<WalletConnectorProps> = ({
  transactionPayload,
}) => {
  const { toast } = useToast();
  const { transaction, setTransaction } = useTransaction();
  const { addAddresses } = useWallet();

  const getAddresses = useCallback(async () => {
    try {
      const accounts = await window.unisat.requestAccounts();

      const addresses: Account[] = [];
      for (const address of accounts) {
        addresses.push({
          address,
          chainId: "bitcoin",
          signer: WalletName.UNISAT,
        });
      }

      addAddresses(addresses);

      toast({
        description:
          "Connected to UniSat Wallet, please check portfolio page to see your assets",
      });
    } catch (e) {
      toast({
        description:
          "Failed to connect to Unisat Wallet, verify if you allow connectivity",
        variant: "destructive",
      });
      throw e;
    } finally {
      await window.unisat.disconnect();
    }
  }, [toast, addAddresses]);

  const sign = useCallback(async () => {
    if (!transactionPayload) {
      return;
    }

    try {
      // TODO: support multiple chains (LTC, DOGE...etc)
      const toSign = transactionPayload.encoded.find(
        (encoded) => encoded.raw?.format === "PSBT"
      );

      if (!toSign || !toSign.raw?.value) {
        throw new Error("No transaction to sign found");
      }
      const signature = await window.unisat.signPsbt(toSign.raw?.value);

      transaction && setTransaction({ ...transaction, signature });
    } catch (err) {
      console.warn("Failed to sign with UniSat wallet: ", err);
      toast({
        description: "Transaction failed",
        variant: "destructive",
      });
    }
  }, [setTransaction, toast, transaction, transactionPayload]);

  return (
    <div className="relative w-24 h-24">
      <Avatar
        className="cursor-pointer w-24 h-24"
        onClick={transactionPayload ? () => sign() : () => getAddresses()}
      >
        <AvatarImage src={"/wallets/UniSat.svg"} alt={"unisat"} />
        <AvatarFallback>UniSat Wallet</AvatarFallback>
      </Avatar>
    </div>
  );
};
