"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Account, IWallet, WalletName } from "~/components/wallets/types";
import { WalletContext } from "~/hooks/useWallet";
import { showroomAddresses } from "~/utils/showroomAddresses";
import { SignerFactory } from "~/signers/SignerFactory";
import { SignerType } from "~/signers/types";

const localStorage = typeof window !== "undefined" ? window.localStorage : null;

export const WalletProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [allAddresses, setAllAddresses] = useState<Account[]>([]);
  const [isShowroom, setShowroom] = useState<boolean>(false);
  const [isWalletMenuOpen, setWalletMenuOpen] = useState(false);
  // Track real wallet addresses separately
  const [realWalletAddresses, setRealWalletAddresses] = useState<Account[]>([]);
  // Track recently added addresses for optimized portfolio refresh
  const [recentlyAddedAddresses, setRecentlyAddedAddresses] = useState<
    Account[]
  >([]);
  // Track current signer to filter addresses
  const [currentSigner, setCurrentSigner] = useState<SignerType>(SignerType.SODOT);

  // Filter addresses based on current signer
  const addresses = useMemo(() => {
    if (isShowroom) {
      console.log('[WalletProvider] Using showroom addresses');
      return showroomAddresses;
    }
    
    // Get the wallet name that corresponds to the current signer
    const walletName = currentSigner === SignerType.IOFINNET 
      ? WalletName.IOFINNET 
      : currentSigner === SignerType.TURNKEY
      ? WalletName.TURNKEY
      : currentSigner === SignerType.BLOCKDAEMON
      ? WalletName.BLOCKDAEMON
      : WalletName.SODOT;
    
    console.log('[WalletProvider] Filtering addresses:', {
      currentSigner,
      walletName,
      totalAddresses: allAddresses.length,
      addressesWithSigners: allAddresses.map(a => ({
        chainId: a.chainId,
        address: a.address.substring(0, 10) + '...',
        signer: a.signer
      }))
    });
    
    // Filter addresses to only show those from the current signer
    const filtered = allAddresses.filter(addr => addr.signer === walletName);
    
    console.log('[WalletProvider] After filtering:', {
      filteredCount: filtered.length,
      filteredAddresses: filtered.map(a => ({
        chainId: a.chainId,
        address: a.address.substring(0, 10) + '...',
        signer: a.signer
      }))
    });
    
    return filtered;
  }, [allAddresses, currentSigner, isShowroom]);

  useEffect(() => {
    const localDataAddresses = localStorage?.getItem("AdamikClientAddresses");
    const parsedAddresses = localDataAddresses
      ? JSON.parse(localDataAddresses)
      : [];

    const localDataClientState = localStorage?.getItem("AdamikClientState");
    const localDataClientStateParsed = JSON.parse(localDataClientState || "{}");
    const showroomState = localDataClientStateParsed?.isShowroom || false;

    // Get the current signer type
    const savedSigner = SignerFactory.getSelectedSignerType();
    console.log('[WalletProvider] Initial setup:', {
      savedSigner,
      parsedAddressesCount: parsedAddresses.length,
      addresses: parsedAddresses.map((a: any) => ({
        chainId: a.chainId,
        address: a.address?.substring(0, 10) + '...',
        signer: a.signer
      }))
    });
    setCurrentSigner(savedSigner);

    // Store the real wallet addresses separately
    setRealWalletAddresses(parsedAddresses);

    // Set addresses based on showroom state
    if (showroomState) {
      setAllAddresses(showroomAddresses);
    } else {
      setAllAddresses(parsedAddresses);
    }

    setShowroom(showroomState);
  }, []);

  // Listen for signer changes
  useEffect(() => {
    const handleSignerChange = () => {
      const newSigner = SignerFactory.getSelectedSignerType();
      console.log('[WalletProvider] Signer change detected:', {
        oldSigner: currentSigner,
        newSigner,
        changed: newSigner !== currentSigner
      });
      setCurrentSigner(newSigner);
    };

    // Listen for settings changes which might include signer changes
    window.addEventListener("adamik-settings-changed", handleSignerChange);

    return () => {
      window.removeEventListener("adamik-settings-changed", handleSignerChange);
    };
  }, []);

  const addWallet = (wallet: IWallet) => {
    const exist = wallets.find((w) => w.id === wallet.id);
    if (!exist) {
      setWallets([...wallets, wallet]);
    }
  };

  const addAddresses = (newAddresses: Account[]) => {
    console.log('[WalletProvider] addAddresses called with:', {
      count: newAddresses.length,
      addresses: newAddresses.map(a => ({
        chainId: a.chainId,
        address: a.address.substring(0, 10) + '...',
        signer: a.signer
      }))
    });
    
    // First identify which addresses are actually new
    const actuallyNewAddresses: Account[] = [];

    newAddresses.forEach((newAddr) => {
      const exists = allAddresses.some(
        (addr) =>
          addr.address === newAddr.address && addr.chainId === newAddr.chainId
      );
      if (!exists) {
        actuallyNewAddresses.push(newAddr);
      }
    });

    console.log('[WalletProvider] Actually new addresses:', {
      count: actuallyNewAddresses.length,
      addresses: actuallyNewAddresses.map(a => ({
        chainId: a.chainId,
        address: a.address.substring(0, 10) + '...',
        signer: a.signer
      }))
    });

    // Set the recently added addresses for optimized portfolio refresh
    if (actuallyNewAddresses.length > 0) {
      setRecentlyAddedAddresses(actuallyNewAddresses);
    }

    setAllAddresses((oldAddresses) => {
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
    // Clear recently added addresses when removing addresses
    setRecentlyAddedAddresses([]);

    setAllAddresses((oldAddresses) => {
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

  // Clear the recently added addresses (useful after refresh)
  const clearRecentlyAddedAddresses = () => {
    setRecentlyAddedAddresses([]);
  };

  // Improved setShowroom function that properly handles address switching
  const handleSetShowroom = (showroomState: boolean) => {
    // Clear recently added addresses when toggling showroom
    setRecentlyAddedAddresses([]);

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
      if (!isShowroom && allAddresses.length > 0) {
        setRealWalletAddresses(allAddresses);
        localStorage?.setItem(
          "AdamikClientAddresses",
          JSON.stringify(allAddresses)
        );
      }
      // Switch to demo addresses
      setAllAddresses(showroomAddresses);
    } else {
      // Switch back to real addresses
      setAllAddresses(realWalletAddresses);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallets,
        addWallet,
        addresses,
        setAddresses: setAllAddresses,
        addAddresses,
        removeAddresses,
        setWalletMenuOpen,
        isWalletMenuOpen,
        isShowroom,
        setShowroom: handleSetShowroom,
        recentlyAddedAddresses,
        clearRecentlyAddedAddresses,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
