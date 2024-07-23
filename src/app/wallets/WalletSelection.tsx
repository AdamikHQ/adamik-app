"use client";

import { FirstVisitTooltip } from "~/components/FirstVisitTooltip";
import { useWallet } from "~/hooks/useWallet";
import { Modal } from "~/components/ui/modal";
import { Button } from "~/components/ui/button";
import { Wallet } from "lucide-react";
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
      {/* Tooltip component to show instructions on first visit */}
      <FirstVisitTooltip
        text="Use the toggle to switch between demo and wallet mode."
        showOnFirstVisit
      >
        <div
          className="flex items-center space-x-2 cursor-pointer"
          id="toggle-showroom"
          onClick={() => setShowroom(!isShowroom)}
        >
          <Switch id="toggle-showroom" checked={isShowroom} />
          <Label htmlFor="toggle-showroom">Demo</Label>
        </div>
      </FirstVisitTooltip>

      {/* Button to open wallet connection modal */}
      <Button className="" onClick={() => setWalletMenuOpen(true)}>
        <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
      </Button>

      {/* Modal for wallet connection */}
      <Modal
        open={isWalletMenuOpen}
        setOpen={setWalletMenuOpen}
        modalTitle="Connect your wallets"
        modalContent={<WalletModalContent />}
      />
    </div>
  );
};
