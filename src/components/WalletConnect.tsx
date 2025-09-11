"use client";

import React from "react";
import { useWallet } from "~/hooks/useWallet";
import { MultiChainConnect } from "./wallets/MultiChainConnect";
import { SignerSelector } from "./SignerSelector";

/**
 * WalletConnect
 * The unified wallet connection component for the entire application
 * - Shows connection status and chain count
 * - Provides access to wallet connection modal
 * - Shows current signer selection
 */
export function WalletConnect() {
  const { addresses } = useWallet();

  const hasConnectedWallets = addresses.length > 0;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-card shadow-lg border border-border">
      {/* Chain Selection */}
      <MultiChainConnect
        size="sm"
        className="font-medium"
        variant={hasConnectedWallets ? "secondary" : "default"}
      />

      {/* Signer Selection */}
      <SignerSelector showLabel={false} />
    </div>
  );
}
