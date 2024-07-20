import React from "react";
import { TransactionEncodeResponse } from "~/api/adamik/encode";

type TransactionContextType = {
  transaction: TransactionEncodeResponse | undefined;
  setTransaction: (transaction: TransactionEncodeResponse | undefined) => void;
  signedTransaction: string | undefined;
  setSignedTransaction: (signedTransaction: string | undefined) => void;
  transactionHash: string | undefined;
  setTransactionHash: (transactionHash: string | undefined) => void;
};

export const TransactionContext = React.createContext<TransactionContextType>({
  transaction: undefined,
  transactionHash: undefined,
  signedTransaction: undefined,
  setTransaction: () => {},
  setTransactionHash: () => {},
  setSignedTransaction: () => {},
});

export const useTransaction = () => {
  const context = React.useContext(TransactionContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
