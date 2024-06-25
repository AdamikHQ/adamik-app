"use client";

import { LoaderIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useChains } from "~/hooks/useChains";
import { useWallet } from "~/hooks/useWallet";
import { MetamaskWallet } from "./MetamaskWallet";
import { Address, IWallet } from "./types";

export const WalletModalContent = () => {
  const { addWallet, addAddress, addresses, wallets: asWallets } = useWallet();
  const { data: chains, isLoading } = useChains();

  const wallets = [
    {
      name: MetamaskWallet.name,
      icon: "/wallets/Metamask.svg",
      connect: async (setWalletAddresses: (wallet: IWallet) => void) => {
        console.log("connect");
        const metamaskWallet = await MetamaskWallet.initialize();
        setWalletAddresses(metamaskWallet);
      },
    },
  ];

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

  const setWalletAddresses = async (wallet: IWallet) => {
    addWallet(wallet);
    const walletAddresses = await wallet.getAddresses();

    const addresses = walletAddresses.reduce<Address[]>((acc, address) => {
      const familyAddresses = families[wallet.families[0]].map((family) => {
        return {
          address,
          chainId: family,
        };
      });
      return [...acc, ...familyAddresses];
    }, []);

    addresses.forEach((address) => {
      addAddress(address);
    });
  };

  return (
    <div>
      {wallets.map((wallet) => {
        return (
          <Avatar
            key={wallet.name}
            className="cursor-pointer w-24 h-24"
            onClick={() => wallet.connect(setWalletAddresses)}
          >
            <AvatarImage src={wallet.icon} alt={wallet.name} />
            <AvatarFallback>{wallet.name}</AvatarFallback>
          </Avatar>
        );
      })}
    </div>
  );
};
