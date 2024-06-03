"use client";

import React from "react";
import { ThemeProvider } from "./ThemeProvider";

export const AppProviders: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
};
