"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from 'next-themes';

type TransactionLoadingProps = {
  onNextStep: () => void;
};

export const TransactionLoading = ({ onNextStep }: TransactionLoadingProps) => {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
    setTimeout(() => {
      onNextStep();
    }, 3000);
  }, [onNextStep]);

  if (!mounted) return null; // Ensures theme is mounted before rendering

  return (
    <div>
      <div className="flex h-[120px] w-[120px] items-center m-auto">
        <Image
          className="animate-spin"
          alt="Adamik logo"
          src={
            theme === "light"
              ? "/adamik_symbol_blue.svg"
              : "/adamik_symbol_white.svg"
          }
          width={64}
          height={64}
        />
      </div>
      <div className="p-4">
        Your transaction request has been sent to the Adamik API, and processing is currently underway!
      </div>
    </div>
  );
};