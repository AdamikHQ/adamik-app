"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useWallet } from "~/hooks/useWallet";
import { MetamaskWallet } from "./MetamaskWallet";
import { Address, IWallet } from "./types";
import { Button } from "~/components/ui/button";
import { useChains } from "~/hooks/useChains";
import { LoaderIcon } from "lucide-react";

export const WalletModalContent = () => {
  const { wallets, addWallet, addresses, setAddresses } = useWallet();
  const { data: chains, isLoading } = useChains();

  const addMetamaskWallet = () => {
    const metamask = new MetamaskWallet();
    addWallet(metamask);
  };

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

  const getWalletAddresses = async (wallet: IWallet) => {
    const walletAddresses = await wallet.getAddresses();

    setAddresses([
      ...walletAddresses.reduce<Address[]>((acc, address) => {
        const familyAddresses = families[wallet.families[0]].map((family) => {
          return {
            address,
            chainId: family,
          };
        });
        return [...acc, ...familyAddresses];
      }, []),
    ]);
  };
  return (
    <div>
      <Avatar
        className="cursor-pointer w-24 h-24"
        onClick={() => addMetamaskWallet()}
      >
        <AvatarImage src="/wallets/Metamask.svg" alt="Metamask" />
        <AvatarFallback>Metamask</AvatarFallback>
      </Avatar>
      DEBUG HERE :
      {wallets.map((wallet) => (
        <div key={wallet.id}>
          {wallet.id} -{" "}
          <Button onClick={() => getWalletAddresses(wallet)}>
            Get addresses
          </Button>
        </div>
      ))}
      ADDRESSES :
      {addresses.map((address) => (
        <div key={`${address.address}_${address.chainId}`}>
          {address.address} - {address.chainId}
        </div>
      ))}
    </div>
  );
};
