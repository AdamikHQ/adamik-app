"use client";

import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ConnectStarknetkitModal } from "./ConnectStarknetkitModal";
import { StarkNetConnectorButton } from "./StarkNetConnectorButton";
import { Button } from "~/components/ui/button";
import { ENABLED_CONNECTORS } from "./connectors";

export const ConnectStarknet = () => {
  const { isConnected } = useAccount();
  const { connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {isConnected ? (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
      ) : (
        <ConnectStarknetkitModal />
      )}
    </div>
  );
};
