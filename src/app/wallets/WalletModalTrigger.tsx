"use client";

import { Modal } from "~/components/ui/modal";
import { WalletModalContent } from "./WalletModalContent";
import { Button } from "~/components/ui/button";
import { Wallet } from "lucide-react";
import { useWallet } from "~/hooks/useWallet";

export const WalletModalTrigger = () => {
  const { isWalletMenuOpen, setWalletMenuOpen } = useWallet();

  return (
    <div>
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
