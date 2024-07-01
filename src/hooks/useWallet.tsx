import React from "react";
import { Address, IWallet } from "~/app/wallets/types";

type WalletContextType = {
  wallets: IWallet[];
  addWallet: (wallet: IWallet) => void;
  addresses: Address[];
  addAddresses: (addresses: Address[]) => void;
  setAddresses: (addresses: Address[]) => void;
  setOpenWalletMenu: React.Dispatch<React.SetStateAction<boolean>>;
  openWalletMenu: boolean;
};

export const WalletContext = React.createContext<WalletContextType>({
  wallets: [],
  addWallet: () => {},
  addresses: [],
  addAddresses: () => {},
  setAddresses: () => {},
  setOpenWalletMenu: () => {},
  openWalletMenu: false,
});

export const useWallet = () => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
