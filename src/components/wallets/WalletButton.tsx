"use client";

import React from "react";
import { WalletSelection } from "./WalletSelection";
import { useWallet } from "~/hooks/useWallet";
import { Button } from "~/components/ui/button";

/**
 * WalletButton component
 * Shows either the MultiChainConnect button or the number of connected chains
 */
export function WalletButton() {
  const { addresses } = useWallet();
  const hasConnectedWallets = addresses.length > 0;

  if (hasConnectedWallets) {
    return (
      <div className="rounded-full bg-secondary/80 border px-4 py-1 text-sm shadow-sm">
        {addresses.length} {addresses.length === 1 ? "Chain" : "Chains"}{" "}
        Connected
      </div>
    );
  }

  return <WalletSelection size="sm" variant="outline" position="inline" />;
}
