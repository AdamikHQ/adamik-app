"use client";

import React from "react";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { WalletProvider } from "./WalletProvider";
import { TransactionProvider } from "./TransactionProvider";
import { ErrorBoundary } from "~/components/ErrorBoundary";

export const AppProviders: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <WalletProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TransactionProvider>{children}</TransactionProvider>
          </ThemeProvider>
        </WalletProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};
