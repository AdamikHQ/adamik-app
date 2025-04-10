import React, { useCallback } from "react";
import { useToast } from "~/components/ui/use-toast";
import { useWallet } from "~/hooks/useWallet";
import { Account, WalletConnectorProps, WalletName } from "./types";
import { SodotSigner } from "~/signers/Sodot";
import {
  AdamikCurve,
  AdamikHashFunction,
  AdamikSignerSpec,
} from "~/adamik/types";
import { Button } from "~/components/ui/button";

export const SodotConnect: React.FC<WalletConnectorProps> = ({
  chainId,
  transactionPayload,
}) => {
  const { toast } = useToast();
  const { addAddresses } = useWallet();

  const getAddresses = useCallback(async () => {
    try {
      // Initialize Sodot signer with appropriate curve based on chain
      const curve =
        chainId === "bitcoin" ? AdamikCurve.SECP256K1 : AdamikCurve.ED25519;
      const signerSpec: AdamikSignerSpec = {
        curve,
        hashFunction: AdamikHashFunction.SHA256,
        coinType: "0",
        signatureFormat: "der",
      };

      const sodotSigner = new SodotSigner(chainId || "ethereum", signerSpec);

      // Get public key
      const pubkey = await sodotSigner.getPubkey();

      // Create account with the public key
      const account: Account = {
        address: pubkey, // Using pubkey as address for now
        chainId: chainId || "ethereum",
        pubKey: pubkey,
        signer: WalletName.SODOT,
      };

      addAddresses([account]);

      toast({
        description:
          "Connected to Sodot Wallet, please check portfolio page to see your assets",
      });
    } catch (e) {
      toast({
        description: "Failed to connect to Sodot Wallet, please try again",
        variant: "destructive",
      });
      throw e;
    }
  }, [chainId, addAddresses, toast]);

  const sign = useCallback(async () => {
    if (!transactionPayload) return;

    try {
      const curve =
        chainId === "bitcoin" ? AdamikCurve.SECP256K1 : AdamikCurve.ED25519;
      const signerSpec: AdamikSignerSpec = {
        curve,
        hashFunction: AdamikHashFunction.SHA256,
        coinType: "0",
        signatureFormat: "der",
      };

      const sodotSigner = new SodotSigner(chainId || "ethereum", signerSpec);
      const signature = await sodotSigner.signTransaction(
        transactionPayload.encoded
      );

      // Handle the signature as needed
      console.log("Transaction signed:", signature);
    } catch (err) {
      console.warn("Failed to sign with Sodot wallet:", err);
      toast({
        description: "Transaction failed",
        variant: "destructive",
      });
    }
  }, [chainId, transactionPayload, toast]);

  return (
    <Button
      className="w-full"
      onClick={transactionPayload ? () => sign() : () => getAddresses()}
    >
      {transactionPayload ? "Sign Transaction" : "Connect Sodot Wallet"}
    </Button>
  );
};
