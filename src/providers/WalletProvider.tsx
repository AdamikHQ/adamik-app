"use client";

import React, { useEffect, useState } from "react";
import { Account, IWallet } from "~/components/wallets/types";
import { WalletContext } from "~/hooks/useWallet";
import { showroomAddresses } from "~/utils/showroomAddresses";

const localStorage = typeof window !== "undefined" ? window.localStorage : null;

export const WalletProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [addresses, setAddresses] = useState<Account[]>([]);
  const [isShowroom, setShowroom] = useState<boolean>(false);
  const [isWalletMenuOpen, setWalletMenuOpen] = useState(false);
  // Track real wallet addresses separately
  const [realWalletAddresses, setRealWalletAddresses] = useState<Account[]>([]);

  useEffect(() => {
    const localDataAddresses = localStorage?.getItem("AdamikClientAddresses");
    const parsedAddresses = localDataAddresses
      ? JSON.parse(localDataAddresses)
      : [];

    const localDataClientState = localStorage?.getItem("AdamikClientState");
    const localDataClientStateParsed = JSON.parse(localDataClientState || "{}");
    const showroomState = localDataClientStateParsed?.isShowroom || false;

    // Store the real wallet addresses separately
    setRealWalletAddresses(parsedAddresses);

    // Set addresses based on showroom state
    if (showroomState) {
      setAddresses(showroomAddresses);
    } else {
      setAddresses(parsedAddresses);
    }

    setShowroom(showroomState);
  }, []);

  const addWallet = (wallet: IWallet) => {
    const exist = wallets.find((w) => w.id === wallet.id);
    if (!exist) {
      setWallets([...wallets, wallet]);
    }
  };

  const addAddresses = (newAddresses: Account[]) => {
    setAddresses((oldAddresses) => {
      const mergedAddresses = [...oldAddresses, ...newAddresses];

      const uniqueAddresses = mergedAddresses.filter(
        (value, index, self) =>
          index ===
          self.findIndex(
            (t) => t.address === value.address && t.chainId === value.chainId
          )
      );

      // Only save to localStorage if not in showroom mode
      if (!isShowroom) {
        localStorage?.setItem(
          "AdamikClientAddresses",
          JSON.stringify(uniqueAddresses)
        );
        // Update real wallet addresses as well
        setRealWalletAddresses(uniqueAddresses);
      }

      return uniqueAddresses;
    });
  };

  const removeAddresses = (addressesToRemove: Account[]) => {
    setAddresses((oldAddresses) => {
      const remainingAddresses = oldAddresses.filter(
        (addr) =>
          !addressesToRemove.some(
            (toRemove) =>
              toRemove.address === addr.address &&
              toRemove.chainId === addr.chainId
          )
      );

      // Only save to localStorage if not in showroom mode
      if (!isShowroom) {
        localStorage?.setItem(
          "AdamikClientAddresses",
          JSON.stringify(remainingAddresses)
        );
        // Update real wallet addresses as well
        setRealWalletAddresses(remainingAddresses);
      }

      return remainingAddresses;
    });
  };

  // Improved setShowroom function that properly handles address switching
  const handleSetShowroom = (showroomState: boolean) => {
    // Save the current state to client state
    const localData = localStorage?.getItem("AdamikClientState");
    const oldLocalData = JSON.parse(localData || "{}");
    localStorage?.setItem(
      "AdamikClientState",
      JSON.stringify({ ...oldLocalData, isShowroom: showroomState })
    );

    // Update state
    setShowroom(showroomState);

    // Switch addresses based on showroom state
    if (showroomState) {
      // Save real addresses before switching to demo
      if (!isShowroom && addresses.length > 0) {
        setRealWalletAddresses(addresses);
        localStorage?.setItem(
          "AdamikClientAddresses",
          JSON.stringify(addresses)
        );
      }
      // Switch to demo addresses
      setAddresses(showroomAddresses);
    } else {
      // Switch back to real addresses
      setAddresses(realWalletAddresses);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallets,
        addWallet,
        addresses,
        setAddresses,
        addAddresses,
        removeAddresses,
        setWalletMenuOpen,
        isWalletMenuOpen,
        isShowroom,
        setShowroom: handleSetShowroom,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
