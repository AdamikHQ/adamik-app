export type PortfolioAddresses = Record<string, string[]>;

export interface Token {
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

// Full transaction object
export type Transaction = {
  data: TransactionData;
  encoded: string;
  signature: string;
};

// Response status for any request to the Adamik API
export type Status = {
  errors: { message: string }[];
  warnings: { message: string }[];
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

export type FinalizedTransaction = {
  parsed?: {
    chainId: string;
    id: string;
    mode: TransactionMode;
    tokenId?: string;
    state: string;
    blockHeight?: string;
    timestamp?: number;
    senders: {
      address: string;
    }[];
    recipients: {
      address: string;
      amount: string;
    }[];
    validators?: {
      source?: {
        address: string;
      };
      target?: {
        address: string;
        amount: string;
      };
    };
    fees: string;
    gas?: string;
    nonce?: string;
    memo?: string;
  };
  raw: unknown; // The raw transaction as returned from the node (or explorer when necessary)
};

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
  supportedFeatures: ChainSupportedFeatures;
};

type ChainSupportedFeatures = {
  read: {
    account: {
      balances: {
        native: boolean;
        tokens: boolean;
        staking: boolean;
      };
      transactions: {
        native: boolean;
        tokens: boolean;
        staking: boolean;
      };
    };
    transaction: {
      native: boolean;
      tokens: boolean;
      staking: boolean;
    };
  };
  write: {
    transaction: {
      type: {
        native: boolean;
        tokens: boolean;
        staking: boolean;
      };
      field: {
        memo: boolean;
      };
    };
  };
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

export type TokenInfo = {
  chainId: string;
  type: string;
  id: string;
  name: string;
  ticker: string;
  decimals: string;
  contractAddress: string;
};

export type BackendErrorResponse = {
  status: {
    errors: Array<{ message: string }>;
    warnings: Array<{ message: string }>;
  };
};
