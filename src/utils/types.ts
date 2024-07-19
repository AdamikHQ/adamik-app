export type PortfolioAddresses = Record<string, string[]>;

export enum TransactionMode {
  TRANSFER = "transfer",
  TRANSFER_TOKEN = "transferToken",
  DELEGATE = "delegate",
}

export type Transaction = {
  mode: TransactionMode;
  senders: string[];
  recipients?: string[];
  validatorAddress?: string;
  tokenId?: string;
  useMaxAmount: boolean;
  chainId: string;
  amount: string;
  fees?: string;
  gas?: string;
  nonce?: string;
  format?: string;
  memo?: string;
  params?: {
    pubKey?: string;
  };
};

export type Asset = {
  logo: string;
  mainChainLogo?: string;
  mainChainName?: string;
  chainId: string;
  assetId?: string;
  name: string;
  balanceMainUnit: string | null;
  balanceUSD: number | undefined;
  ticker: string;
  address: string;
  pubKey?: string;
  contractAddress?: string;
  decimals: number;
  isToken: boolean;
  isStakable?: boolean;
};

export enum Feature {
  BALANCES_NATIVE = "balances.native",
  BALANCES_TOKENS = "balances.tokens",
  BALANCES_STAKING = "balances.staking",
  TRANSACTIONS_NATIVE = "transactions.native",
  TRANSACTIONS_TOKENS = "transactions.tokens",
  TRANSACTIONS_STAKING = "transactions.staking",
  MEMO = "memo",
}

export type Chain = {
  decimals: number;
  ticker: string;
  id: string;
  name: string;
  params: any;
  family: string;
  isTestNet: boolean;
  nativeId: string;
  supportedFeatures: Feature[];
};

export type Validator = {
  stakedAmount: number;
  address: string;
  name: string;
  commission: number;
  chainId: string;
  chainName: string;
  chainLogo?: string;
  decimals: number;
  ticker: string;
};

export type SupportedBlockchain = Chain & {
  logo?: string;
};
