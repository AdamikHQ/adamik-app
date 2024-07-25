import React from "react";
import { Transaction } from "~/utils/types";

type TransactionContextType = {
  transaction: Transaction | undefined;
  setTransaction: (transaction: Transaction | undefined) => void;
  transactionHash: string | undefined;
  setTransactionHash: (transactionHash: string | undefined) => void;
};

export const TransactionContext = React.createContext<TransactionContextType>({
  transaction: undefined,
  setTransaction: () => {},
  transactionHash: undefined,
  setTransactionHash: () => {},
});

export const useTransaction = () => {
  const context = React.useContext(TransactionContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
