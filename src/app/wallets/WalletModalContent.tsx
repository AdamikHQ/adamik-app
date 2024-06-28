"use client";

import { LoaderIcon } from "lucide-react";
import { useChains } from "~/hooks/useChains";
import { useWallet } from "~/hooks/useWallet";
import { MetamaskConnect } from "./MetamaskConnect";
import { Address } from "./types";
import { KeplrConnect } from "./KeplrConnect";

export const WalletModalContent = () => {
  const { addAddresses } = useWallet();
  const { data: chains, isLoading } = useChains();

  if (isLoading) {
    return <LoaderIcon className="animate-spin" />;
  }

  const families = Object.values(chains!.chains).reduce<
    Record<string, string[]>
  >((acc, chainDetail) => {
    return {
      ...acc,
      [chainDetail.family]: [
        ...(acc[chainDetail.family] || []),
        chainDetail.id,
      ],
    };
  }, {});

  const setWalletAddresses = async (
    walletAddresses: string[],
    chainIds: string[]
  ) => {
    const addresses = walletAddresses.reduce<Address[]>((acc, address) => {
      const familyAddresses = chainIds.map((chainId) => {
        return {
          address,
          chainId,
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
