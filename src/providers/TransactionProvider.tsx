"use client";

import React, { useState } from "react";
import { TransactionContext } from "~/hooks/useTransaction";
import { Transaction } from "~/utils/types";

export const TransactionProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [chainId, setChainId] = useState<string | undefined>();
  const [transaction, setTransaction] = useState<Transaction | undefined>();
  const [transactionHash, setTransactionHash] = useState<string | undefined>();

  return (
    <TransactionContext.Provider
      value={{
        chainId,
        setChainId,
        transaction,
        setTransaction,
        transactionHash,
        setTransactionHash,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
