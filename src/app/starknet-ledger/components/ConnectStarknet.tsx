"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { useLedgerContext } from "~/providers/LedgerProvider";
import { LedgerConnect } from "./LedgerConnect";

export const ConnectStarknet = () => {
  const { isConnected: isLedgerConnected, disconnect: disconnectLedger } =
    useLedgerContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {isLedgerConnected ? (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => disconnectLedger()}
        >
          Disconnect
        </Button>
      ) : (
        <>
          <LedgerConnect />
        </>
      )}
    </div>
  );
};
