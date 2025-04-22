import { useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";
import { useTransaction } from "~/hooks/useTransaction";
import { useWallet } from "~/hooks/useWallet";
import { Account, WalletConnectorProps, WalletName } from "./types";
import { getSignPsbtDefaultOptions, Network } from "./utils";

// TODO Handle testnet setting, to decide to include signet or not
const bitcoinChainIdsMapping = new Map<string, string>([
  ["bitcoin", "BITCOIN_MAINNET"],
  ["bitcoin-signet", "BITCOIN_SIGNET"],
]);

export const UniSatConnect: React.FC<WalletConnectorProps> = ({
  chainId,
  transactionPayload,
}) => {
  const { toast } = useToast();
  const { transaction, setTransaction } = useTransaction();
  const { addAddresses } = useWallet();

  const getAddresses = useCallback(async () => {
    try {
      // Get initial accounts to establish connection
      await window.unisat.requestAccounts();

      const addresses: Account[] = [];

      // Loop through all chains in the mapping
      for (const [
        adamikChainId,
        unisatChainId,
      ] of bitcoinChainIdsMapping.entries()) {
        try {
          // Switch to the current chain
          await window.unisat.switchChain(unisatChainId);

          // Get accounts and public key for the current chain
          const accounts = await window.unisat.getAccounts();
          const pubKey = await window.unisat.getPublicKey();

          // Add addresses for the current chain
          for (const address of accounts) {
            addresses.push({
              address,
              pubKey,
              chainId: adamikChainId,
              signer: WalletName.UNISAT,
            });
          }
        } catch (chainErr) {
          console.warn(
            `Failed to get addresses for chain ${adamikChainId}:`,
            chainErr
          );
        }
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
    }
  }, [toast, addAddresses]);

  const sign = useCallback(async () => {
    if (!transactionPayload) {
      return;
    }

    try {
      // Find the UniSat chain ID that corresponds to the transaction's chain ID
      const unisatChainId = chainId && bitcoinChainIdsMapping.get(chainId);

      if (!unisatChainId) {
        throw new Error(
          `Unsupported chain: ${transactionPayload.data.chainId}`
        );
      }

      // Switch to the appropriate chain before signing
      await window.unisat.switchChain(unisatChainId);

      const unisatParams = getSignPsbtDefaultOptions(
        transactionPayload.encoded,
        transactionPayload.data.senderPubKey!,
        transactionPayload.data.senderAddress,
        chainId === "bitcoin-signet" ? Network.SIGNET : Network.MAINNET
      );

      const signature = await window.unisat.signPsbt(
        transactionPayload.encoded,
        unisatParams
      );

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
