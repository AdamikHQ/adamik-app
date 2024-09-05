export type PortfolioAddresses = Record<string, string[]>;

interface Token {
  chainId: string;
  type: string;
  id: string;
  name: string;
  ticker: string;
  decimals: number;
  contractAddress?: string;
}

export interface TokenAmount {
  amount: string;
  token: Token;
}

// FIXME Confusing name!
// - not linked to 1 single validator
// - confusion with StakingPosition in helpers.ts
interface ValidatorPosition {
  validatorAddresses: string[];
  amount: string;
  status: string;
  completionDate?: number;
}

// This interface represents the rewards for staking.
interface Reward {
  validatorAddress: string;
  amount: string;
  token?: Token; // Adding this to link rewards to the token information
}

// This interface represents the balances including native, tokens, and staking.
interface Balances {
  native: {
    available: string;
    total: string;
  };
  tokens: TokenAmount[];
  staking?: {
    total: string;
    locked: string;
    unlocking: string;
    unlocked: string;
    positions?: ValidatorPosition[];
    rewards: {
      native: Reward[];
      tokens: Reward[];
    };
  };
}

// This interface represents the state of an address, including its chain and balances.
export type AccountState = {
  chainId: string;
  accountId: string;
  balances: Balances;
};

// This interface represents the aggregated balances across an address's assets.
export type AggregatedBalances = {
  availableBalance: number;
  stakedBalance: number;
  claimableRewards: number;
  unstakingBalance: number;
};

// Enum to represent different transaction modes.
export enum TransactionMode {
  TRANSFER = "transfer",
  TRANSFER_TOKEN = "transferToken",
  DELEGATE = "delegate",
  UNDELEGATE = "undelegate",
  CLAIM_REWARDS = "claimRewards",
}

// Plain transaction object without additional metadata.
export type TransactionData = {
  mode: TransactionMode;
  sender: string;
  recipient?: string;
  validatorAddress?: string;
  tokenId?: string;
  useMaxAmount: boolean;
  chainId: string;
  amount?: string;
  fees?: string;
  gas?: string;
  nonce?: string;
  format?: string;
  memo?: string;
  params?: {
    pubKey?: string;
  };
};

// Full transaction object including metadata like status and signature.
export type Transaction = {
  data: TransactionData;
  encoded: string;
  signature: string;
  status: { errors: { message: string }[]; warnings: { message: string }[] };
};

// Represents an asset in a portfolio.
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

// Enum to list different features that a chain might support.
export enum Feature {
  READ_ACCOUNT_BALANCES_NATIVE = "read.account.balances.native",
  READ_ACCOUNT_BALANCES_TOKENS = "read.account.balances.tokens",
  READ_ACCOUNT_BALANCES_STAKING = "read.account.balances.staking",
  READ_TRANSACTION_NATIVE = "read.transaction.native",
  READ_TRANSACTION_TOKENS = "read.transaction.tokens",
  READ_TRANSACTION_STAKING = "read.transaction.staking",
  WRITE_TRANSACTION_TYPE_NATIVE = "write.transaction.type.native",
  WRITE_TRANSACTION_TYPE_TOKENS = "write.transaction.type.tokens",
  WRITE_TRANSACTION_TYPE_STAKING = "write.transaction.type.staking",
  WRITE_TRANSACTION_FIELD_MEMO = "write.transaction.field.memo",
}

// Represents the configuration of a blockchain.
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

// Represents a validator in a staking system.
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

// Represents a blockchain supported by the application.
export type SupportedBlockchain = Chain & {
  logo?: string;
  labels?: string[]; // To define the list of features supported
};
