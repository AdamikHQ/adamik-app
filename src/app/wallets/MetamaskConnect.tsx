import { useSDK } from "@metamask/sdk-react";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";

type MetamaskConnectProps = {
  setWalletAddresses: (
    walletAddresses: string[],
    walletFamilies: string[]
  ) => void;
};

export const MetamaskConnect: React.FC<MetamaskConnectProps> = ({
  setWalletAddresses,
}) => {
  const { sdk } = useSDK();
  const { toast } = useToast();

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      setWalletAddresses(accounts, [
        "ethereum",
        "base",
        "optimism",
        "arbitrum",
      ]); // TODO: no more discovery method because it's too slow, need to find a better way to add chains then
      toast({
        description:
          "Connected to Metamask, please check portfolio page to see your assets",
      });
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  };

  return (
    <div className="relative w-24 h-24">
      <Avatar className="cursor-pointer w-24 h-24" onClick={() => connect()}>
        <AvatarImage src={"/wallets/Metamask.svg"} alt={"metamask"} />
        <AvatarFallback>Metamask</AvatarFallback>
      </Avatar>
    </div>
  );
};
