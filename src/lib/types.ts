export type CoinGeckoCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
};

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
