import { useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";
import { useTransaction } from "~/hooks/useTransaction";
import { useWallet } from "~/hooks/useWallet";
import { Account, WalletConnectorProps, WalletName } from "./types";

export const LitescribeConnect: React.FC<WalletConnectorProps> = ({
  transactionPayload,
}) => {
  const { toast } = useToast();
  const { transaction, setTransaction } = useTransaction();
  const { addAddresses } = useWallet();

  const getAddresses = useCallback(async () => {
    try {
      const accounts = await window.litescribe.requestAccounts();

      const addresses: Account[] = [];
      for (const address of accounts) {
        addresses.push({
          address,
          chainId: "litecoin",
          signer: WalletName.LITESCRIBE,
        });
      }

      addAddresses(addresses);

      toast({
        description:
          "Connected to Litescribe Wallet, please check portfolio page to see your assets",
      });
    } catch (e) {
      toast({
        description:
          "Failed to connect to Litescribe Wallet, verify if you allow connectivity",
        variant: "destructive",
      });
      throw e;
    } finally {
      console.log(window.litescribe);
      // FIXME: litescribe does not support disconnect and requires the user to manually disconnect
      // - Because litescribe is a fork of unisat, we would expect to have the same interface, but that function doesn't.
      // - Unisat implemented the disconnect feature recently: https://github.com/unisat-wallet/extension/commit/645a8a4f5d7743d2e6097f7f17bd8a19f0c4bc7e
      //   after it was forked.
      // await window.litescribe.disconnect();
    }
  }, [toast, addAddresses]);

  const sign = useCallback(async () => {
    if (!transactionPayload) {
      return;
    }

    try {
      const toSign = transactionPayload.encoded.find(
        (encoded) => encoded.raw?.format === "PSBT"
      );

      if (!toSign || !toSign.raw?.value) {
        throw new Error("No transaction to sign found");
      }
      const signature = await window.litescribe.signPsbt(toSign.raw?.value);

      transaction && setTransaction({ ...transaction, signature });
    } catch (err) {
      console.warn("Failed to sign with Litescribe wallet: ", err);
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
        <AvatarImage src={"/wallets/Litescribe.svg"} alt={"litescribe"} />
        <AvatarFallback>Litescribe Wallet</AvatarFallback>
      </Avatar>
    </div>
  );
};
