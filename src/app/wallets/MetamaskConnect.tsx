import { useSDK } from "@metamask/sdk-react";
import React, { useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";
import { WalletConnectorProps, WalletName } from "./types";
import { useChainDetails } from "~/hooks/useChainDetails";
import { useTransaction } from "~/hooks/useTransaction";
import { etherumNetworkConfig } from "~/utils/ethereumNetworks";

export const MetamaskConnect: React.FC<WalletConnectorProps> = ({
  setWalletAddresses,
  transactionPayload,
}) => {
  const { sdk } = useSDK();
  const { toast } = useToast();
  const { setTransactionHash } = useTransaction();
  const { data } = useChainDetails(
    transactionPayload?.transaction.plain.chainId
  );

  const connect = useCallback(async () => {
    try {
      const accounts = await sdk?.connect();
      if (accounts && setWalletAddresses) {
        setWalletAddresses(
          accounts,
          ["ethereum", "bsc", "optimism", "arbitrum", "base"],
          WalletName.METAMASK
        );
        toast({
          description:
            "Connected to Metamask, please check portfolio page to see your assets",
        });
      } else {
        toast({
          description:
            "Failed to connect to Metamask, verify if you allow connectivity",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  }, [sdk, setWalletAddresses, toast]);

  const sign = useCallback(async () => {
    const provider = sdk?.getProvider();

    if (provider && transactionPayload) {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + Number(data?.nativeId).toString(16) }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [etherumNetworkConfig[data?.params.name]],
            });
          } catch (addError) {
            throw addError;
          }
        }
        throw switchError;
      }

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [transactionPayload.transaction.encoded],
      });

      if (typeof txHash === "string") {
        setTransactionHash(txHash);
      } else {
        toast({
          description: "Transaction failed",
          variant: "destructive",
        });
      }
    }
  }, [sdk, transactionPayload, data, setTransactionHash, toast]);

  return (
    <div className="relative w-24 h-24">
      <Avatar
        className="cursor-pointer w-24 h-24"
        onClick={transactionPayload ? () => sign() : () => connect()}
      >
        <AvatarImage src={"/wallets/Metamask.svg"} alt={"metamask"} />
        <AvatarFallback>Metamask</AvatarFallback>
      </Avatar>
    </div>
  );
};
