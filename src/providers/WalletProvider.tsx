"use client";

import { wallets as cosmosWallets } from "@cosmos-kit/keplr";
import { ChainProvider } from "@cosmos-kit/react-lite";
import { MetaMaskProvider } from "@metamask/sdk-react";
import { assets, chains } from "chain-registry";
import React, { useEffect, useState } from "react";
import { Address, IWallet } from "~/app/wallets/types";
import { WalletContext } from "~/hooks/useWallet";

const localStorage = typeof window !== "undefined" ? window.localStorage : null;

export const WalletProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isShowroom, setShowroom] = useState<boolean>(false);
  const [isWalletMenuOpen, setWalletMenuOpen] = useState(false);

  useEffect(() => {
    const localDataAddresses = localStorage?.getItem("AdamikClientAddresses");
    setAddresses(localDataAddresses ? JSON.parse(localDataAddresses) : []);

    const localDataShowroom = localStorage?.getItem("AdamikClientState");
    setShowroom(
      localDataShowroom ? JSON.parse(localDataShowroom).isShowroom : false
    );
  }, []);

  const addWallet = (wallet: IWallet) => {
    const exist = wallets.find((w) => w.id === wallet.id);
    if (!exist) {
      setWallets([...wallets, wallet]);
    }
  };

  const addAddresses = (receiveAddresses: Address[]) => {
    setAddresses((oldAddresses) => {
      const mergedAddresses = [...oldAddresses, ...receiveAddresses];

      const uniqueAddresses = mergedAddresses.filter(
        (value, index, self) =>
          index ===
          self.findIndex(
            (t) => t.address === value.address && t.chainId === value.chainId
          )
      );

      localStorage?.setItem(
        "AdamikClientAddresses",
        JSON.stringify(uniqueAddresses)
      );

      return uniqueAddresses;
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
            isShowroom,
            setShowroom: (isShowroom: boolean) => {
              localStorage?.setItem(
                "AdamikClientState",
                JSON.stringify({ isShowroom: isShowroom })
              );
              setShowroom(isShowroom);
            },
          }}
        >
          {children}
        </WalletContext.Provider>
      </ChainProvider>
    </MetaMaskProvider>
  );
};
