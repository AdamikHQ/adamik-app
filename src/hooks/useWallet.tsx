import React from "react";
import { Address, IWallet } from "~/components/wallets/types";

type WalletContextType = {
  wallets: IWallet[];
  addWallet: (wallet: IWallet) => void;
  addresses: Address[];
  addAddresses: (addresses: Address[]) => void;
  setAddresses: (addresses: Address[]) => void;
  setWalletMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isWalletMenuOpen: boolean;
  isShowroom: boolean;
  setShowroom: (isShowroom: boolean) => void;
};

export const WalletContext = React.createContext<WalletContextType>({
  isShowroom: false,
  setShowroom: () => {},
  wallets: [],
  addWallet: () => {},
  addresses: [],
  addAddresses: () => {},
  setAddresses: () => {},
  setWalletMenuOpen: () => {},
  isWalletMenuOpen: false,
});

export const useWallet = () => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
