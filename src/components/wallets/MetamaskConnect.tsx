import { useSDK } from "@metamask/sdk-react";
import React, { useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";
import { Address, WalletConnectorProps, WalletName } from "./types";
import { useTransaction } from "~/hooks/useTransaction";
import { etherumNetworkConfig } from "~/utils/ethereumNetworks";
import { useWallet } from "~/hooks/useWallet";
import { useChains } from "~/hooks/useChains";

/**
 * Metamask:
 * - Returns more than 1 address
 * - Each address is valid for several (all?) supported chain IDs
 */
export const MetamaskConnect: React.FC<WalletConnectorProps> = ({
  transactionPayload,
}) => {
  const { sdk } = useSDK();
  const { toast } = useToast();
  const { setTransactionHash } = useTransaction();
  const { data: chains } = useChains();
  const { addAddresses } = useWallet();

  const evmChains = useMemo(
    () =>
      chains && Object.values(chains).filter((chain) => chain.family === "evm"),
    [chains]
  );

  const evmChainIds = useMemo(
    () => evmChains && evmChains.map((chain) => chain.id),
    [evmChains]
  );

  const getAddresses = useCallback(async () => {
    try {
      const metamaskAddresses: string[] = await sdk?.connect();

      if (metamaskAddresses && evmChainIds) {
        const addresses: Address[] = [];
        // NOTE Should we add all addresses in Metamask? Only the 1st one? Let the user choose?
        for (const address of metamaskAddresses) {
          // FIXME Should loop over all supported chains for full discovery, but limited for now for performance
          //for (const chainId of evmChainIds)
          for (const chainId of ["ethereum", "optimism", "arbitrum", "base"])
            addresses.push({
              address,
              chainId,
              signer: WalletName.METAMASK,
            });
        }

        addAddresses(addresses);

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
      console.warn("Failed to connect to Metamask wallet..", err);
    }
  }, [sdk, addAddresses, toast, evmChainIds]);

  const sign = useCallback(async () => {
    const provider = sdk?.getProvider();

    if (provider && transactionPayload) {
      const chainId = transactionPayload.data.chainId;
      const chain = evmChains?.find((chain) => chain.id === chainId);

      if (!chain) {
        throw new Error(`${chainId} is not supported by Metamask wallet`);
      }

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + Number(chain.nativeId).toString(16) }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [etherumNetworkConfig[chain.params.name]],
            });
          } catch (addError) {
            throw addError;
          }
        }
        throw switchError;
      }

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [transactionPayload.encoded],
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
  }, [sdk, evmChains, transactionPayload, setTransactionHash, toast]);

  return (
    <div className="relative w-24 h-24">
      <Avatar
        className="cursor-pointer w-24 h-24"
        onClick={transactionPayload ? () => sign() : () => getAddresses()}
      >
        <AvatarImage src={"/wallets/Metamask.svg"} alt={"metamask"} />
        <AvatarFallback>Metamask</AvatarFallback>
      </Avatar>
    </div>
  );
};
