"use client";

import { createContext, ReactNode, useContext } from "react";
import { useLedger } from "~/hooks/useLedger";

interface LedgerContextType {
  isConnected: boolean;
  isConnecting: boolean;
  transport: any | null;
  starknetClient: any | null;
  publicKey: string | null;
  address: string | null;
  error: Error | null;
  connect: () => Promise<any>;
  disconnect: () => Promise<void>;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export const useLedgerContext = () => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error("useLedgerContext must be used within a LedgerProvider");
  }
  return context;
};

export const LedgerProvider = ({ children }: { children: ReactNode }) => {
  const ledgerState = useLedger();

  return (
    <LedgerContext.Provider value={ledgerState}>
      {children}
    </LedgerContext.Provider>
  );
};
