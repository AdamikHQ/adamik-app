"use client";

import { useConnect } from "@starknet-react/core";
import { StarknetkitConnector, useStarknetkitConnectModal } from "starknetkit";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { mainnet } from "@starknet-react/chains";

export const ConnectStarknetkitModal = () => {
  const { connectAsync, connectors } = useConnect();
  const { toast } = useToast();

  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as StarknetkitConnector[],
    modalTheme: "dark",
    dappName: "Adamik StarkNet",
  });

  return (
    <Button
      className="w-full"
      onClick={async () => {
        try {
          const { connector } = await starknetkitConnectModal();
          if (!connector) {
            // User closed the modal
            return;
          }

          // Connect with selected connector
          await connectAsync({
            connector,
          });

          toast({
            title: "Connected successfully",
            description: "Your StarkNet wallet has been connected.",
            duration: 3000,
          });
        } catch (error) {
          console.error("Connection error:", error);
          toast({
            title: "Connection failed",
            description: "Failed to connect to the wallet. Please try again.",
            variant: "destructive",
            duration: 5000,
          });
        }
      }}
    >
      Connect Argent Web Wallet
    </Button>
  );
};
