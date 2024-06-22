import React from "react";
import { Address, IWallet } from "~/app/wallets/types";

type WalletContextType = {
  wallets: IWallet[];
  addWallet: (wallet: IWallet) => void;
  addresses: Address[];
  addAddress: (address: Address) => void;
  setAddresses: (addresses: Address[]) => void;
};

export const WalletContext = React.createContext<WalletContextType>({
  wallets: [],
  addWallet: () => {},
  addresses: [],
  addAddress: () => {},
  setAddresses: () => {},
});

export const useWallet = () => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
