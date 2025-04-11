"use client";

import React from "react";
import { WalletModal } from "./WalletModal";
import { WalletStatusIndicator } from "./WalletStatusIndicator";

/**
 * ClientWalletComponents
 * A client component wrapper that bundles the wallet-related UI components
 */
export function ClientWalletComponents() {
  return (
    <>
      <WalletModal />
      <WalletStatusIndicator />
    </>
  );
}
