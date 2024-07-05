import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MobulaMarketMultiDataResponse } from "~/api/mobula/marketMultiData";
import { MobulaBlockchain } from "~/api/mobula/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const mobulaNameMapper: Record<string, string> = {
  optimism: "optimistic",
  "arbitrum one": "arbitrum",
};

export const getMobulaName = (name: string) => {
  return mobulaNameMapper[name] || name;
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
    maximumFractionDigits: decimals,
  }).format(parsedAmount);
}

const getSelfHostedLogo = (ticker: string) => {
  switch (ticker) {
    case "DYDX":
      return "/assets/dydx.svg";
  }
  return "";
};

type RetrieveLogoFromSourceProps = {
  asset: {
    name: string;
    ticker: string;
  };
  mobulaMarketData: MobulaMarketMultiDataResponse | undefined | null;
  mobulaBlockChainData?: MobulaBlockchain[] | undefined;
};

export const resolveLogo = ({
  asset: { name, ticker },
  mobulaMarketData,
  mobulaBlockChainData,
}: RetrieveLogoFromSourceProps) => {
  const byBlockchainName = mobulaBlockChainData?.find((mobulaBlockchain) => {
    return (
      mobulaBlockchain.name.toLowerCase() ===
      getMobulaName(name.toLowerCase()).toLowerCase()
    );
  });

  if (byBlockchainName) {
    return byBlockchainName.logo;
  }

  const byTicker = mobulaMarketData && mobulaMarketData?.[ticker]?.logo;
  if (byTicker) {
    return byTicker;
  }

  // Temporary solution for missing logo in Mobula
  const selfHosted = getSelfHostedLogo(ticker);
  if (selfHosted) {
    return selfHosted;
  }

  return "";
};
