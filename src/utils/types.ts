export type PortfolioAddresses = Record<string, string[]>;

export enum TransactionMode {
  TRANSFER = "transfer",
  TRANSFER_TOKEN = "transferToken",
}

export type Transaction = {
  mode: TransactionMode;
  senders: string[];
  recipients: string[];
  useMaxAmount: boolean;
  chainId: string;
  amount: string;
  fees?: string;
  gas?: string;
  format?: string;
  pubKey?: string;
  memo?: string;
};

export type Asset = {
  logo: string;
  mainChainLogo?: string;
  assetId?: string;
  chainId: string;
  name: string;
  balanceMainUnit: string | null;
  balanceUSD: number | undefined;
  ticker: string;
  address: string;
  subAssets?: Asset[];
};
