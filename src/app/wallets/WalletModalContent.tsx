"use client";

import { useWallet } from "~/hooks/useWallet";
import { KeplrConnect } from "./KeplrConnect";
import { MetamaskConnect } from "./MetamaskConnect";
import { Address } from "./types";

export const WalletModalContent = () => {
  const { addAddresses } = useWallet();

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

    addAddresses(addresses);
  };

  return (
    <div className="flex flex-row gap-4">
      <MetamaskConnect setWalletAddresses={setWalletAddresses} />
      <KeplrConnect setWalletAddresses={setWalletAddresses} />
    </div>
  );
};
