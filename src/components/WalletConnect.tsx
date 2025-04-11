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

  // For users with no connected wallets who are not in demo mode,
  // provide direct access to MultiChainConnect
  if (!hasConnectedWallets && !isShowroom) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-black/90 shadow-lg border border-gray-800">
        <MultiChainConnect size="sm" className="font-medium" />

        {/* Demo Mode Toggle */}
        <div className="flex items-center px-3 h-9 rounded-md border border-gray-700 bg-black/80 text-white text-sm">
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

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-black/90 shadow-lg border border-gray-800">
      {/* Connect Wallet Button */}
      <Button
        size="sm"
        variant={hasConnectedWallets ? "secondary" : "default"}
        onClick={() => setWalletMenuOpen(true)}
        className="font-medium"
      >
        {hasConnectedWallets
          ? `${addresses.length} ${
              addresses.length === 1 ? "Chain" : "Chains"
            }${isShowroom ? " (Demo)" : ""}`
          : "Connect Wallet"}
      </Button>

      {/* Demo Mode Toggle */}
      <div className="flex items-center px-3 h-9 rounded-md border border-gray-700 bg-black/80 text-white text-sm">
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
