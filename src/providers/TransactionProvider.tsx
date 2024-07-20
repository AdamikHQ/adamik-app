"use client";

import React, { useState } from "react";
import { TransactionEncodeResponse } from "~/api/adamik/encode";
import { TransactionContext } from "~/hooks/useTransaction";

export const TransactionProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [transaction, setTransaction] = useState<
    TransactionEncodeResponse | undefined
  >();

  const [transactionHash, setTransactionHash] = useState<string | undefined>();
  const [signedTransaction, setSignedTransaction] = useState<
    string | undefined
  >();

  return (
    <TransactionContext.Provider
      value={{
        transaction,
        transactionHash,
        signedTransaction,
        setTransaction,
        setTransactionHash,
        setSignedTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
