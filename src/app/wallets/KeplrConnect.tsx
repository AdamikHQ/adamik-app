import { useWalletClient } from "@cosmos-kit/react-lite";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";

type KeplrConnectProps = {
  setWalletAddresses: (
    walletAddresses: string[],
    walletFamilies: string[]
  ) => void;
};

export const KeplrConnect: React.FC<KeplrConnectProps> = ({
  setWalletAddresses,
}) => {
  const { status, client } = useWalletClient("keplr-extension");
  const { toast } = useToast();

  const connect = async () => {
    try {
      if (status === "Done" && client) {
        await client.enable?.(["cosmoshub-4"]);
        const address = await client.getAccount?.("cosmoshub-4");
        if (address) {
          setWalletAddresses([address.address], ["cosmoshub"]);
        }

        const osmoAddress = await client.getAccount?.("osmosis");
        if (osmoAddress) {
          setWalletAddresses([osmoAddress.address], ["osmosis"]);
        }
      }
      toast({
        description:
          "Connected to Keplr, please check portfolio page to see your assets",
      });
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  };

  return (
    <div className="relative w-24 h-24">
      <Avatar className="cursor-pointer w-24 h-24" onClick={() => connect()}>
        <AvatarImage src={"/wallets/Keplr.svg"} alt={"Keplr"} />
        <AvatarFallback>Keplr</AvatarFallback>
      </Avatar>
    </div>
  );
};
