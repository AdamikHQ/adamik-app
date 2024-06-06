import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CoinIdMapperCoinGeckoToAdamik = (coinId: string) => {
  switch (coinId) {
    case "cosmos":
      return "cosmoshub";
  }
  return coinId;
};
