"use client";

import React from "react";
import { Modal } from "~/components/ui/modal";
import { useWallet } from "~/hooks/useWallet";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { MultiChainConnect } from "./MultiChainConnect";

/**
 * WalletModal
 * Central modal for connecting to wallets when triggered by any wallet connection button
 */
export const WalletModal: React.FC = () => {
  const { isWalletMenuOpen, setWalletMenuOpen, isShowroom, setShowroom } =
    useWallet();

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

          <div className="flex items-center justify-center mb-8">
            <Label
              htmlFor="modal-demo-mode"
              className="text-sm font-medium mr-3"
            >
              Wallet
            </Label>
            <Switch
              id="modal-demo-mode"
              checked={isShowroom}
              onCheckedChange={setShowroom}
              className="data-[state=checked]:bg-primary"
            />
            <Label
              htmlFor="modal-demo-mode"
              className="text-sm font-medium ml-3"
            >
              Demo
            </Label>
          </div>

          <div className="mb-8 text-center text-muted-foreground text-sm">
            {isShowroom
              ? "Using demo mode with sample wallets. No real transactions will be made."
              : "Connect to all available chains with a single click."}
          </div>

          <MultiChainConnect className="w-full" />
        </div>
      }
    />
  );
};
