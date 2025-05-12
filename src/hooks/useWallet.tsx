import React from "react";
import { Account, IWallet } from "~/components/wallets/types";

type WalletContextType = {
  wallets: IWallet[];
  addWallet: (wallet: IWallet) => void;
  addresses: Account[];
  addAddresses: (addresses: Account[]) => void;
  removeAddresses: (addresses: Account[]) => void;
  setAddresses: (addresses: Account[]) => void;
  setWalletMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isWalletMenuOpen: boolean;
  isShowroom: boolean;
  setShowroom: (isShowroom: boolean) => void;
  recentlyAddedAddresses: Account[];
  clearRecentlyAddedAddresses: () => void;
};

export const WalletContext = React.createContext<WalletContextType>({
  isShowroom: false,
  setShowroom: () => {},
  wallets: [],
  addWallet: () => {},
  addresses: [],
  addAddresses: () => {},
  removeAddresses: () => {},
  setAddresses: () => {},
  setWalletMenuOpen: () => {},
  isWalletMenuOpen: false,
  recentlyAddedAddresses: [],
  clearRecentlyAddedAddresses: () => {},
});

export const useWallet = () => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
