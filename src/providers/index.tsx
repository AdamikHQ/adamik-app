"use client";

import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";
import {
  ArcElement,
  Chart as ChartJS,
  Colors,
  Legend,
  Tooltip,
} from "chart.js";
import { WalletProvider } from "./WalletProvider";

ChartJS.register(ArcElement, Tooltip, Legend, Colors);
ChartJS.defaults.color = "#bdbdbd";

export const AppProviders: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <QueryProvider>
      <WalletProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </WalletProvider>
    </QueryProvider>
  );
};
