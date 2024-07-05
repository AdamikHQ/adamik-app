"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export const TransactionLoading = () => {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Ensures theme is mounted before rendering

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="font-bold text-xl text-center">
        Your intent is being processed
      </h1>
      <div className="flex items-center justify-center h-[120px] w-[120px]">
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
      <p className="text-center text-sm text-gray-400">
        Adamik is converting your intent into a blockchain transaction
      </p>
    </div>
  );
};
