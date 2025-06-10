import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MobulaMarketMultiDataResponse } from "~/api/mobula/marketMultiData";
import { MobulaBlockchain } from "~/api/mobula/types";
import { Chain, FinalizedTransaction, ParsedTransaction } from "~/utils/types";

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

/**
 * Checks if a transaction is a self-transfer (sender and recipient are the same address)
 */
export const isSelfTransfer = (
  transaction: FinalizedTransaction | ParsedTransaction | null | undefined
): boolean => {
  if (!transaction) return false;

  let parsed: ParsedTransaction | undefined;

  if ("parsed" in transaction) {
    parsed = transaction.parsed;
  } else {
    parsed = transaction as ParsedTransaction;
  }

  if (!parsed) return false;

  return (
    parsed.senders?.length > 0 &&
    parsed.recipients?.length > 0 &&
    parsed.senders[0].address === parsed.recipients[0].address
  );
};

// Helpers to convert from/to user-convenient format in main unit, and smallest unit of the chain
export function amountToSmallestUnit(amount: number, decimals: number): string {
  const computedAmount = Number(amount) * Math.pow(10, decimals);
  return Math.trunc(computedAmount).toFixed();
}

export function amountToMainUnit(
  amount: string,
  decimals: number
): string | null {
  const parsedAmount = Number(amount);
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
    typeof amount === "number" ? amount : Number(amount ?? "0");

  if (isNaN(parsedAmount)) {
    return "0";
  }

  if (parsedAmount > 0 && parsedAmount < 0.00001) {
    return "<0.00001";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(parsedAmount);
}

const getSelfHostedLogo = (ticker: string) => {
  //Define the list of ticker (uppercase) we use local icons for
  const supportedTickers = ["PALM", "RBTC"];

  if (supportedTickers.includes(ticker)) {
    return `/assets/${ticker.toLowerCase()}.svg`;
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
  // First, try to find a self-hosted logo
  const selfHosted = getSelfHostedLogo(ticker);
  if (selfHosted) {
    return selfHosted;
  }

  // If not found, try to find the logo in mobulaBlockChainData by matching the name
  const byBlockchainName = mobulaBlockChainData?.find((mobulaBlockchain) => {
    return (
      mobulaBlockchain.name.toLowerCase() ===
      getMobulaName(name.toLowerCase()).toLowerCase()
    );
  });

  if (byBlockchainName) {
    return byBlockchainName.logo;
  }

  // If still not found, try to find the logo in mobulaMarketData by ticker
  const byTicker = mobulaMarketData && mobulaMarketData?.[ticker]?.logo;
  if (byTicker) {
    return byTicker;
  }

  // If no logo is found, return an empty string
  return "";
};

export const isStakingSupported = (chain: Chain): boolean => {
  return (
    chain.supportedFeatures.read.account.balances.staking &&
    chain.supportedFeatures.write.transaction.type.stake
  );
};
