import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const coinIdMapping: { [key: string]: string } = {
  cosmos: "cosmoshub",
  binancecoin: "bsc",
  "avalanche-2": "avalanche",
  "matic-network": "polygon",
  // TODO: Add mapping for LINEA
};

export const CoinIdMapperCoinGeckoToAdamik = (coinId: string): string => {
  return coinIdMapping[coinId] || coinId;
};

// Helpers to convert from/to user-convenient format in main unit, and smallest unit of the chain
export function amountToSmallestUnit(amount: string, decimals: number): string {
  const computedAmount = parseFloat(amount) * Math.pow(10, decimals);
  return computedAmount.toString();
}

export function amountToMainUnit(
  amount: string,
  decimals: number
): string | null {
  const parsedAmount = parseInt(amount);
  return Number.isNaN(parsedAmount)
    ? null
    : (parsedAmount / Math.pow(10, decimals)).toString();
}

export function formatAmountUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatAmount(amount: string | number | null, decimals: number) {
  const parsedAmount =
    typeof amount === "number" ? amount : parseFloat(amount ?? "0");
  if (isNaN(parsedAmount)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(parsedAmount);
}
