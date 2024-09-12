"use client";

import { wallets as cosmosWallets } from "@cosmos-kit/keplr";
import { ChainProvider } from "@cosmos-kit/react-lite";
import { MetaMaskProvider } from "@metamask/sdk-react";
import { assets, chains } from "chain-registry";
import React, { useEffect, useState } from "react";
import { Address, IWallet } from "~/components/wallets/types";
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

    const localDataClientState = localStorage?.getItem("AdamikClientState");
    const localDataClientStateParsed = JSON.parse(localDataClientState || "{}");
    setShowroom(localDataClientStateParsed?.isShowroom || false);
  }, []);

  useEffect(() => {
    if (addresses.length > 0) {
      setShowroom(false);
    }
  }, [addresses]);

  const addWallet = (wallet: IWallet) => {
    const exist = wallets.find((w) => w.id === wallet.id);
    if (!exist) {
      setWallets([...wallets, wallet]);
    }
  };

  const addAddresses = (newAddresses: Address[]) => {
    setAddresses((oldAddresses) => {
      const mergedAddresses = [...oldAddresses, ...newAddresses];

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
              : "https://app.adamik.io/",
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
              const localData = localStorage?.getItem("AdamikClientState");
              const oldLocalData = JSON.parse(localData || "{}");
              localStorage?.setItem(
                "AdamikClientState",
                JSON.stringify({ ...oldLocalData, isShowroom: isShowroom })
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
