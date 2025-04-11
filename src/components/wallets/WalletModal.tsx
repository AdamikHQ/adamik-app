"use client";

import React, { useEffect } from "react";
import { Modal } from "~/components/ui/modal";
import { useWallet } from "~/hooks/useWallet";
import { MultiChainConnect } from "./MultiChainConnect";

/**
 * WalletModal
 * Central modal for connecting to wallets
 * Automatically triggers connect when opened from welcome modal
 */
export const WalletModal: React.FC = () => {
  const { isWalletMenuOpen, setWalletMenuOpen } = useWallet();

  // Auto-trigger the connection when the modal opens
  useEffect(() => {
    if (isWalletMenuOpen) {
      // Use a short timeout to ensure the button is rendered
      const timer = setTimeout(() => {
        const connectButton = document.getElementById(
          "multi-chain-connect-button"
        );
        if (connectButton) {
          connectButton.click();
        }
      }, 300); // Slightly longer timeout to ensure modal is fully rendered

      return () => clearTimeout(timer);
    }
  }, [isWalletMenuOpen]);

  const handleClose = () => {
    setWalletMenuOpen(false);
  };

  return (
    <Modal
      open={isWalletMenuOpen}
      setOpen={handleClose}
      modalContent={
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-center">
            Connect Your Wallet
          </h2>

          <p className="mb-6 text-center text-muted-foreground text-sm">
            Connect to all available chains with a single click.
          </p>

          <MultiChainConnect className="w-full" />
        </div>
      }
    />
  );
};
