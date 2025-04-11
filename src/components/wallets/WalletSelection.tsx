"use client";

import React from "react";
import { WalletConnectorProps } from "./types";
import { SodotConnect } from "./SodotConnect";
import { MultiChainConnect } from "./MultiChainConnect";

export const WalletSelection: React.FC<WalletConnectorProps> = (props) => {
  // If specific chainId or transaction payload is provided, use the original SodotConnect
  // which allows selecting a single chain or signing transactions
  if (props.chainId || props.transactionPayload) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-4 w-full max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-2">Select a wallet</h2>
        <div className="flex flex-col w-full gap-4">
          <SodotConnect {...props} />
        </div>
      </div>
    );
  }

  // For general wallet connection, use the auto-connect with multiple chains
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4 w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Select a wallet</h2>
      <div className="flex flex-col w-full gap-4">
        <MultiChainConnect />
      </div>
    </div>
  );
};
