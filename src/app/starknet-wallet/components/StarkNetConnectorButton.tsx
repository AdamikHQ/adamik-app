"use client";

import { Connector, useConnect } from "@starknet-react/core";
import { ReactNode } from "react";
import { Button } from "~/components/ui/button";

interface StarkNetConnectorButtonProps {
  connector: Connector;
  icon: ReactNode;
}

export const StarkNetConnectorButton = ({
  connector,
  icon,
}: StarkNetConnectorButtonProps) => {
  const { connectAsync } = useConnect();

  if (!connector.available()) {
    return null;
  }

  return (
    <Button
      key={connector.id}
      onClick={async () => {
        await connectAsync({ connector });
      }}
      variant="outline"
      className="h-12 text-sm font-medium gap-2 justify-center"
    >
      <div className="flex items-center gap-2">
        {icon}
        {connector.name}
      </div>
    </Button>
  );
};
