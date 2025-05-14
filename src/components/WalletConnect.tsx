"use client";

import React from "react";
import { useWallet } from "~/hooks/useWallet";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { MultiChainConnect } from "./wallets/MultiChainConnect";

/**
 * WalletConnect
 * The unified wallet connection component for the entire application
 * - Shows connection status and chain count
 * - Provides access to wallet connection modal
 * - Controls demo/real wallet toggle
 */
export function WalletConnect() {
  const { addresses, setWalletMenuOpen, isShowroom, setShowroom } = useWallet();

  const hasConnectedWallets = addresses.length > 0;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-card shadow-lg border border-border">
      {/* Chain Selection */}
      <MultiChainConnect
        size="sm"
        className="font-medium"
        variant={hasConnectedWallets ? "secondary" : "default"}
      />

      {/* Demo Mode Toggle */}
      <div className="flex items-center px-3 h-9 rounded-md border border-border bg-card text-card-foreground text-sm">
        <Label htmlFor="demo-mode" className="text-xs font-medium mr-2">
          Wallet
        </Label>
        <Switch
          id="demo-mode"
          checked={isShowroom}
          onCheckedChange={setShowroom}
          className="data-[state=checked]:bg-primary"
        />
        <Label htmlFor="demo-mode" className="text-xs font-medium ml-2">
          Demo
        </Label>
      </div>
    </div>
  );
}
