"use client";

import React from "react";
import { useWallet } from "~/hooks/useWallet";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { showroomAddresses } from "~/utils/showroomAddresses";

/**
 * WalletConnect
 * The unified wallet connection component for the entire application
 * - Shows connection status and chain count
 * - Provides access to wallet connection modal
 * - Controls demo/real wallet toggle
 */
export function WalletConnect() {
  const {
    addresses,
    setWalletMenuOpen,
    isShowroom,
    setShowroom,
    addAddresses,
    setAddresses,
  } = useWallet();

  const hasConnectedWallets = addresses.length > 0;

  const handleToggleMode = (checked: boolean) => {
    // Toggle between demo mode and real wallet mode
    setShowroom(checked);

    if (checked) {
      // Save current addresses if they're not from showroom
      if (!isShowroom) {
        // Store real addresses in localStorage for restoration later
        localStorage.setItem("realWalletAddresses", JSON.stringify(addresses));
      }

      // Load demo addresses
      addAddresses(showroomAddresses);
    } else {
      // Try to restore real wallet addresses
      const realAddressesStr = localStorage.getItem("realWalletAddresses");
      if (realAddressesStr) {
        try {
          const realAddresses = JSON.parse(realAddressesStr);
          // Only restore if valid JSON array
          if (Array.isArray(realAddresses)) {
            setAddresses(realAddresses);
            return;
          }
        } catch (e) {
          console.error("Error parsing stored addresses:", e);
        }
      }

      // If no stored addresses or error, clear addresses
      setAddresses([]);
    }
  };

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
          ? `${addresses.length} ${addresses.length === 1 ? "Chain" : "Chains"}`
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
          onCheckedChange={handleToggleMode}
          className="data-[state=checked]:bg-primary"
        />
        <Label htmlFor="demo-mode" className="text-xs font-medium ml-2">
          Demo
        </Label>
      </div>
    </div>
  );
}
