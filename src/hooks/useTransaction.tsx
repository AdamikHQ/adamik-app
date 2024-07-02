import React from "react";
import { TransactionEncodeResponse } from "~/api/encode";

type TransactionContextType = {
  transaction: TransactionEncodeResponse | undefined;
  setTransaction: (transaction: TransactionEncodeResponse) => void;
  transactionHash: string | undefined;
  setTransactionHash: (transactionHash: string) => void;
};

export const TransactionContext = React.createContext<TransactionContextType>({
  transaction: undefined,
  transactionHash: undefined,
  setTransaction: () => {},
  setTransactionHash: () => {},
});

export const useTransaction = () => {
  const context = React.useContext(TransactionContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
