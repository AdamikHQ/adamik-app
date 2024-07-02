import { useSDK } from "@metamask/sdk-react";
import React, { useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";
import { WalletConnectorProps, WalletName } from "./types";
import { useChainDetails } from "~/hooks/useChainDetails";
import { useTransaction } from "~/hooks/useTransaction";

const networkConfig: Record<string, any> = {
  sepolia: {
    adamikChainId: "sepolia",
    chainId: "0xaa36a7",
    chainName: "Sepolia",
    rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
    explorerUrl: (hash: string) => `https://sepolia.etherscan.io/tx/${hash}`,
    isTestnet: true,
  },
  holesky: {
    adamikChainId: "holesky",
    chainId: "0x4268",
    chainName: "Holesky",
    rpcUrls: ["https://ethereum-holesky-rpc.publicnode.com"],
    explorerUrl: (hash: string) => `https://holesky.etherscan.io/tx/${hash}`,
    isTestnet: true,
  },
  ethereum: {
    adamikChainId: "ethereum",
    chainId: "0x1",
    chainName: "Ethereum",
    rpcUrls: ["https://eth.llamarpc.com"],
    explorerUrl: (hash: string) => `https://etherscan.io/tx/${hash}`,
  },
  zksync: {
    adamikChainId: "zksync",
    chainId: "0x144",
    chainName: "zkSync",
    rpcUrls: ["https://zksync.drpc.org"],
    explorerUrl: (hash: string) => `https://explorer.zksync.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },
  "zksync-sepolia": {
    adamikChainId: "zksync-sepolia",
    chainId: "0x12c",
    chainName: "zkSync Sepolia",
    rpcUrls: ["https://sepolia.era.zksync.dev"],
    explorerUrl: (hash: string) =>
      `https://sepolia.explorer.zksync.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    isTestnet: true,
  },
  "injective-testnet": {
    adamikChainId: "injective-testnet",
    chainId: "0x978",
    chainName: "zkSync Sepolia",
    rpcUrls: ["https://testnet.rpc.inevm.com/http"],
    explorerUrl: (hash: string) =>
      `https://inevm-testnet.explorer.caldera.xyz/tx/${hash}`,
    nativeCurrency: {
      name: "Injective",
      symbol: "INJ",
      decimals: 18,
    },
    isTestnet: true,
  },
  base: {
    adamikChainId: "base",
    chainId: "0x2105",
    chainName: "Base",
    rpcUrls: ["https://mainnet.base.org"],
    explorerUrl: (hash: string) => `https://basescan.org/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  "base-sepolia": {
    adamikChainId: "base-sepolia",
    chainId: "0x14A34",
    chainName: "Base Sepolia",
    rpcUrls: ["https://sepolia.base.org"],
    explorerUrl: (hash: string) => `https://sepolia.basescan.org/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    isTestnet: true,
  },
  optimism: {
    adamikChainId: "optimism",
    chainId: "0xA",
    chainName: "Optimism",
    rpcUrls: ["https://mainnet.optimism.io"],
    explorerUrl: (hash: string) => `https://optimistic.etherscan.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  "optimism-sepolia": {
    adamikChainId: "optimism-sepolia",
    chainId: "0xAA37DC",
    chainName: "Optimism Sepolia",
    rpcUrls: ["https://sepolia.optimism.io"],
    explorerUrl: (hash: string) =>
      `https://sepolia-optimistic.etherscan.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    isTestnet: true,
  },
  arbitrum: {
    adamikChainId: "arbitrum",
    chainId: "0xa4b1",
    chainName: "Arbitrum One",
    rpcUrls: ["https://arbitrum-mainnet.infura.io"],
    explorerUrl: (hash: string) => `https://arbiscan.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  "arbitrum-sepolia": {
    adamikChainId: "arbitrum-sepolia",
    chainId: "0x66eee",
    chainName: "Arbitrum Sepolia",
    rpcUrls: ["https://arbitrum-sepolia.blockpi.network/v1/rpc/public"],
    explorerUrl: (hash: string) => `https://sepolia.arbiscan.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    isTestnet: true,
  },
};

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
          ["sepolia", "ethereum", "base-sepolia", "optimism", "arbitrum"],
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
              params: [networkConfig[data?.params.name]],
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
