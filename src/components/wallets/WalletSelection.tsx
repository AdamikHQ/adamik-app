"use client";

import React from "react";
import { WalletConnectorProps } from "./types";
import { SodotConnect } from "./SodotConnect";
import { MultiChainConnect } from "./MultiChainConnect";

/**
 * WalletSelection component
 * Only shows up for transaction-specific flows with SodotConnect when chainId or transactionPayload is provided
 * Hidden on regular page headers to avoid duplicate buttons
 */
export const WalletSelection: React.FC<
  WalletConnectorProps & {
    variant?: "default" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    position?: "modal" | "inline";
    forceShow?: boolean; // Add a prop to force showing the button when needed
  }
> = ({
  chainId,
  transactionPayload,
  variant = "default",
  size = "default",
  className = "",
  position = "modal",
  forceShow = false,
}) => {
  // Don't show the MultiChainConnect button in page headers to avoid duplication
  // with the global integrated WalletConnect component
  const isPageHeader = position === "inline" && !forceShow;

  // Hide the component on page headers if it doesn't have specific transaction parameters
  if (isPageHeader && !chainId && !transactionPayload) {
    return null;
  }

  // If specific chainId or transaction payload is provided, use the original SodotConnect
  // which allows selecting a single chain or signing transactions
  if (chainId || transactionPayload) {
    if (position === "modal") {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-4 w-full max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-2">Select a wallet</h2>
          <div className="flex flex-col w-full gap-4">
            <SodotConnect
              chainId={chainId}
              transactionPayload={transactionPayload}
            />
          </div>
        </div>
      );
    } else {
      return (
        <SodotConnect
          chainId={chainId}
          transactionPayload={transactionPayload}
        />
      );
    }
  }

  // For general wallet connection, use the simplified button
  return (
    <MultiChainConnect variant={variant} size={size} className={className} />
  );
};
