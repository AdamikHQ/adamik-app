"use client";

import React from "react";
import { Modal } from "~/components/ui/modal";
import { useWallet } from "~/hooks/useWallet";
import { MultiChainConnect } from "./MultiChainConnect";

/**
 * WalletModal
 * Central modal for connecting to wallets when triggered by any wallet connection button
 */
export const WalletModal: React.FC = () => {
  const { isWalletMenuOpen, setWalletMenuOpen } = useWallet();

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
