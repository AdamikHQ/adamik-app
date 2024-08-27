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

interface TokenAmount {
  amount: string;
  value: string;
  token: Token;
}

// This interface represents the positions of a validator.
interface ValidatorPosition {
  validatorAddresses: string[];
  amount: string;
  status: string;
  completionDate?: number;
}

// This interface represents the rewards for staking.
interface Reward {
  tokenId: string; // Making this required since tokenId is crucial for token rewards
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
export type AddressState = {
  chainId: string;
  address: string;
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
export type PlainTransaction = {
  mode: TransactionMode;
  senders: string[];
  recipients?: string[];
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
  plain: PlainTransaction;
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
  BALANCES_NATIVE = "balances.native",
  BALANCES_TOKENS = "balances.tokens",
  BALANCES_STAKING = "balances.staking",
  TRANSACTIONS_NATIVE = "transactions.native",
  TRANSACTIONS_TOKENS = "transactions.tokens",
  TRANSACTIONS_STAKING = "transactions.staking",
  MEMO = "memo",
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
