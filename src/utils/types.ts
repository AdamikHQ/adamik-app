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
  STAKE = "stake",
  UNSTAKE = "unstake",
  CLAIM_REWARDS = "claimRewards",
}

// Plain transaction object without additional metadata.
export type TransactionData = {
  mode: TransactionMode;
  senderAddress: string;
  senderPubKey?: string;
  recipientAddress?: string;
  validatorAddress?: string;
  sourceValidatorAddress?: string;
  targetValidatorAddress?: string;
  tokenId?: string;
  useMaxAmount: boolean;
  chainId: string;
  amount?: string;
  fees?: string;
  gas?: string;
  nonce?: string;
  format?: string;
  memo?: string;
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
  parsed?: ParsedTransaction;
  raw: unknown; // The raw transaction as returned from the node (or explorer when necessary)
};

export type ParsedTransaction = {
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
  fees: {
    amount: string;
    ticker?: string;
  };
  gas?: string;
  nonce?: string;
  memo?: string;
};

export type ChainSupportedFeatures = {
  read: {
    token: boolean;
    validators: boolean;
    transaction: {
      native: boolean;
      tokens: boolean;
      staking: boolean;
    };
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
  };
  write: {
    transaction: {
      type: {
        deployAccount: boolean;
        transfer: boolean;
        transferToken: boolean;
        stake: boolean;
        unstake: boolean;
        claimRewards: boolean;
        withdraw: boolean;
        registerStake: boolean;
      };
      field: {
        memo: boolean;
      };
    };
  };
  utils: {
    addresses: boolean;
  };
};

export type Chain = {
  family: string;
  id: string;
  nativeId: string;
  name: string;
  ticker: string;
  decimals: number;
  isTestnetFor?: string;
  params: any;
  supportedFeatures: ChainSupportedFeatures;
  signerSpec: {
    curve: string;
    hashFunction: string;
    signatureFormat: string;
    coinType: string;
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

export type BackendErrorResponse = {
  status: {
    errors: Array<{ message: string }>;
    warnings: Array<{ message: string }>;
  };
};

export interface TransactionFees {
  amount: string;
  ticker?: string;
}
