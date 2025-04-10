"use client";

import React from "react";
import { WalletConnectorProps } from "./types";
import { SodotConnect } from "./SodotConnect";

export const WalletSelection: React.FC<WalletConnectorProps> = (props) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4 w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Select a wallet</h2>
      <div className="flex flex-col w-full gap-4">
        <SodotConnect {...props} />
        {/* Other wallet connectors removed */}
      </div>
    </div>
  );
};
