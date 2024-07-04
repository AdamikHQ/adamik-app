"use client";

import React, { useState } from "react";
import { Address, IWallet } from "~/app/wallets/types";
import { WalletContext } from "~/hooks/useWallet";
import { MetaMaskProvider } from "@metamask/sdk-react";
import { ChainProvider } from "@cosmos-kit/react-lite";
import { chains, assets } from "chain-registry";
import { wallets as cosmosWallets } from "@cosmos-kit/keplr";

export const WalletProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isWalletMenuOpen, setWalletMenuOpen] = useState(false);

  const addWallet = (wallet: IWallet) => {
    const exist = wallets.find((w) => w.id === wallet.id);
    if (!exist) {
      setWallets([...wallets, wallet]);
    }
  };

  const addAddresses = (receiveAddresses: Address[]) => {
    setAddresses((oldAddresses) => {
      const mergedAddresses = [...oldAddresses, ...receiveAddresses];

      return mergedAddresses.filter(
        (value, index, self) =>
          index ===
          self.findIndex(
            (t) => t.address === value.address && t.chainId === value.chainId
          )
      );
    });
  };

  return (
    <MetaMaskProvider
      debug={false}
      sdkOptions={{
        checkInstallationImmediately: false,
        logging: { developerMode: false },
        dappMetadata: {
          name: "Adamik App",
          url:
            typeof window !== "undefined"
              ? window.location.host
              : "https://adamik-app.vercel.app/",
        },
      }}
    >
      <ChainProvider
        chains={chains} // supported chains
        assetLists={assets} // supported asset lists
        wallets={cosmosWallets} // supported wallets (only keplr desktop wallet for now)
      >
        <WalletContext.Provider
          value={{
            wallets,
            addWallet,
            addresses,
            setAddresses,
            addAddresses,
            setWalletMenuOpen,
            isWalletMenuOpen,
          }}
        >
          {children}
        </WalletContext.Provider>
      </ChainProvider>
    </MetaMaskProvider>
  );
};
