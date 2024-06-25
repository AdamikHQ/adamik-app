"use client";

import { useState } from "react";
import { Modal } from "~/components/ui/modal";
import { WalletModalContent } from "./WalletModalContent";
import { Button } from "~/components/ui/button";
import { Wallet } from "lucide-react";

export const WalletModalTrigger = () => {
  const [openWalletMenu, setOpenWalletMenu] = useState(false);

  return (
    <div>
      <Button className="" onClick={() => setOpenWalletMenu(true)}>
        <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
      </Button>

      <Modal
        open={openWalletMenu}
        setOpen={setOpenWalletMenu}
        modalTitle="Connect your wallets"
        modalContent={<WalletModalContent />}
      />
    </div>
  );
};
