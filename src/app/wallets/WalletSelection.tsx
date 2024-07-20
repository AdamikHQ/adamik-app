"use client";

import { Modal } from "~/components/ui/modal";
import { Button } from "~/components/ui/button";
import { Wallet } from "lucide-react";
import { useWallet } from "~/hooks/useWallet";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";

import { KeplrConnect } from "./KeplrConnect";
import { MetamaskConnect } from "./MetamaskConnect";
import { PeraConnect } from "./PeraConnect";

const WalletModalContent = () => {
  return (
    <div className="flex flex-row gap-4">
      <MetamaskConnect />
      <KeplrConnect />
      <PeraConnect />
    </div>
  );
};

export const WalletSelection = () => {
  const { isWalletMenuOpen, setWalletMenuOpen, setShowroom, isShowroom } =
    useWallet();

  return (
    <div className="flex flex-row gap-6">
      <div
        className="flex items-center space-x-2"
        onClick={() => setShowroom(!isShowroom)}
      >
        <Switch id="toggle-showroom" checked={isShowroom} />
        <Label htmlFor="toggle-showroom">Demo</Label>
      </div>

      <Button className="" onClick={() => setWalletMenuOpen(true)}>
        <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
      </Button>

      <Modal
        open={isWalletMenuOpen}
        setOpen={setWalletMenuOpen}
        modalTitle="Connect your wallets"
        modalContent={<WalletModalContent />}
      />
    </div>
  );
};
