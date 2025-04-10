"use client";

import React from "react";
import { WalletConnectorProps } from "./types";
import { SodotConnect } from "./SodotConnect";

export const WalletSelection: React.FC<WalletConnectorProps> = (props) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
      <div className="flex flex-wrap justify-center gap-4">
        <SodotConnect {...props} />
      </div>
    </div>
  );
};
