import { useSDK } from "@metamask/sdk-react";
import React, { useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";
import { useChains } from "~/hooks/useChains";
import { useTransaction } from "~/hooks/useTransaction";
import { useWallet } from "~/hooks/useWallet";
import { etherumNetworkConfig } from "~/utils/ethereumNetworks";
import { Account, WalletConnectorProps, WalletName } from "./types";

/**
 * Metamask:
 * - Returns more than 1 address
 * - Each address is valid for several (all?) supported chain IDs
 */
export const MetamaskConnect: React.FC<WalletConnectorProps> = ({
  chainId,
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
      const metamaskAddresses: string[] | undefined = await sdk?.connect();

      if (metamaskAddresses && evmChainIds) {
        const addresses: Account[] = [];
        // NOTE Should we add all addresses from Metamask? Only the 1st one? Let the user choose?
        for (const address of metamaskAddresses) {
          // NOTE Possible to loop over all supported chains for full discovery
          //for (const chainId of evmChainIds)
          for (const chainId of [
            "ethereum",
            "optimism",
            "arbitrum",
            "base",
            "polygon",
          ])
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

      const toSign = transactionPayload.encoded.find(
        (encoded) => encoded.raw?.format === "WALLET_CONNECT"
      );

      if (!toSign || !toSign.raw?.value) {
        throw new Error("No transaction to sign found");
      }

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [JSON.parse(toSign.raw?.value)],
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
  }, [sdk, chainId, evmChains, transactionPayload, setTransactionHash, toast]);

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
