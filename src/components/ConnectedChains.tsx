"use client";

import React from "react";
import { useWallet } from "~/hooks/useWallet";

/**
 * ConnectedChains
 * Shows the number of connected chains at the bottom right of the screen
 */
export function ConnectedChains() {
  const { addresses, isShowroom } = useWallet();
  const hasConnectedWallets = addresses.length > 0;

  if (!hasConnectedWallets) {
    return null; // Only show when wallets are connected
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="rounded-full bg-primary/80 text-primary-foreground px-4 py-2 text-sm shadow-md">
        <span className="font-medium">{addresses.length}</span>{" "}
        {addresses.length === 1 ? "Chain" : "Chains"} Connected
        {isShowroom && <span className="ml-1 text-xs">(Demo)</span>}
      </div>
    </div>
  );
}
