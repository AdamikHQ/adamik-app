"use client";

import React from "react";
import { WalletSelection } from "./WalletSelection";
import { useWallet } from "~/hooks/useWallet";
import { ChainSelector } from "./ChainSelector";

/**
 * WalletButton component
 * Shows either the MultiChainConnect button or the chain selector
 */
export function WalletButton() {
  const { addresses } = useWallet();
  const hasConnectedWallets = addresses.length > 0;

  if (hasConnectedWallets) {
    return <ChainSelector />;
  }

  return <WalletSelection size="sm" variant="outline" position="inline" />;
}
