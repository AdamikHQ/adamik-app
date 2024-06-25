import React, { useState } from "react";
import { Address, IWallet } from "~/app/wallets/types";
import { WalletContext } from "~/hooks/useWallet";

export const WalletProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const addWallet = (wallet: IWallet) => {
    const exist = wallets.find((w) => w.id === wallet.id);
    if (!exist) {
      setWallets([...wallets, wallet]);
    }
  };

  const addAddress = (receiveAddress: Address) => {
    const exist = addresses.find(
      (address) =>
        address.address === receiveAddress.address &&
        address.chainId === receiveAddress.chainId
    );
    if (!exist) {
      setAddresses((oldAddress) => [...oldAddress, receiveAddress]);
    }
  };

  return (
    <WalletContext.Provider
      value={{ wallets, addWallet, addresses, setAddresses, addAddress }}
    >
      {children}
    </WalletContext.Provider>
  );
};
