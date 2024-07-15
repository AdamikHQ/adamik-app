import { useWalletClient } from "@cosmos-kit/react-lite";
import React, { useCallback, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";
import { useTransaction } from "~/hooks/useTransaction";
import { WalletConnectorProps, WalletName } from "./types";
import { useChains } from "~/hooks/useChains";
import { useWallet } from "~/hooks/useWallet";

const cosmosChainIdsMapping = new Map<string, string>();

/**
 * Keplr:
 * - Returns 1 single address for each chain ID
 */
export const KeplrConnect: React.FC<WalletConnectorProps> = ({
  transactionPayload,
}) => {
  const { status, client } = useWalletClient("keplr-extension");
  const { toast } = useToast();
  const { data: chains } = useChains();
  const { addAddresses } = useWallet();

  // Build a mapping table of: adamik chain IDs <> cosmos native chain IDs
  useEffect(() => {
    chains &&
      Object.values(chains)
        .filter((chain) => chain.family === "cosmos")
        .forEach((chain) =>
          cosmosChainIdsMapping.set(chain.id, chain.nativeId)
        );
  }, [chains]);

  const { setSignedTransaction } = useTransaction();

  const getAddresses = useCallback(async () => {
    if (status === "Done" && client) {
      const nativeIds = Array.from(cosmosChainIdsMapping.values());

      // Try to enable Keplr client with all known native chain IDs
      for (const nativeId of nativeIds) {
        try {
          await client.enable?.(nativeId);
        } catch (err) {
          console.warn("Failed to connect to Keplr wallet...", err);
          // Remove the unsupported ones
          cosmosChainIdsMapping.delete(nativeId);
        }
      }

      // For each supported (Adamik) chain ID, get its address from Keplr
      cosmosChainIdsMapping.forEach(async (nativeId, chainId) => {
        try {
          const account = await client.getAccount?.(nativeId);
          if (account) {
            addAddresses([
              {
                address: account.address,
                pubKey: Buffer.from(account.pubkey).toString(),
                chainId,
                signer: WalletName.KEPLR,
              },
            ]);
          }
        } catch (err) {
          console.warn("Failed to connect to Keplr wallet...", err);
          return;
        }
      });

      toast({
        description:
          "Connected to Keplr, please check portfolio page to see your assets",
      });
    }
  }, [status, client, addAddresses, toast]);

  const sign = useCallback(async () => {
    if (client && chains && transactionPayload) {
      const chainId = transactionPayload.transaction.plain.chainId;
      const chain = Object.values(chains).find((chain) => chain.id === chainId);

      if (!chain) {
        throw new Error(`${chainId} is not supported by Keplr wallet`);
      }

      const signedTransaction = await client.signAmino?.(
        chain.nativeId,
        transactionPayload.transaction.plain.senders[0],
        transactionPayload.transaction.encoded as any
      );

      setSignedTransaction(signedTransaction?.signature.signature);
    }
  }, [client, chains, setSignedTransaction, transactionPayload]);

  return (
    <div className="relative w-24 h-24">
      <Avatar
        className="cursor-pointer w-24 h-24"
        onClick={transactionPayload ? () => sign() : () => getAddresses()}
      >
        <AvatarImage src={"/wallets/Keplr.svg"} alt={"Keplr"} />
        <AvatarFallback>Keplr</AvatarFallback>
      </Avatar>
    </div>
  );
};
