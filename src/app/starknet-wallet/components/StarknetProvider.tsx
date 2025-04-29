"use client";

import { mainnet } from "@starknet-react/chains";
import { publicProvider, StarknetConfig } from "@starknet-react/core";
import { ReactNode } from "react";
import { getAvailableConnectors } from "./connectors";

export function StarknetProvider({ children }: { children: ReactNode }) {
  // Only providing mainnet as the available chain
  const chains = [mainnet]; // Only include mainnet
  const providers = publicProvider();
  const connectors = getAvailableConnectors();

  return (
    <StarknetConfig
      chains={chains}
      provider={providers}
      connectors={connectors}
      defaultChainId={mainnet.id}
    >
      {children}
    </StarknetConfig>
  );
}
