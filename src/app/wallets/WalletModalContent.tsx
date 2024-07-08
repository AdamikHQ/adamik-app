"use client";

import { useWallet } from "~/hooks/useWallet";
import { KeplrConnect } from "./KeplrConnect";
import { MetamaskConnect } from "./MetamaskConnect";
import { PeraConnect } from "./PeraConnect";
import { Address } from "./types";

export const WalletModalContent = () => {
  const { addAddresses, setShowroom } = useWallet();

  const setWalletAddresses = async (
    walletAddresses: string[],
    chainIds: string[],
    signer: string
  ) => {
    const addresses = walletAddresses.reduce<Address[]>((acc, address) => {
      const familyAddresses = chainIds.map((chainId) => {
        return {
          address,
          chainId,
          signer,
        };
      });
      return [...acc, ...familyAddresses];
    }, []);

    setShowroom(false);
    addAddresses(addresses);
  };

  return (
    <div className="flex flex-row gap-4">
      <MetamaskConnect setWalletAddresses={setWalletAddresses} />
      <KeplrConnect setWalletAddresses={setWalletAddresses} />
      <PeraConnect setWalletAddresses={setWalletAddresses} />
    </div>
  );
};
