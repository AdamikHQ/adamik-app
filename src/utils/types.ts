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

// FIXME Confusing name!
// - not linked to 1 single validator
// - confusion with StakingPosition in helpers.ts
interface ValidatorPosition {
  validatorAddresses: string[];
  amount: string;
  status: string;
  completionDate?: number;
}

interface Reward {
  tokenId?: string;
  validatorAddress: string;
  amount: string;
}

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

export type AccountState = {
  chainId: string;
  accountId: string;
  balances: Balances;
};

export type AggregatedBalances = {
  availableBalance: number;
  stakedBalance: number;
  claimableRewards: number;
  unstakingBalance: number;
};

export enum TransactionMode {
  TRANSFER = "transfer",
  TRANSFER_TOKEN = "transferToken",
  DELEGATE = "delegate",
  UNDELEGATE = "undelegate",
  CLAIM_REWARDS = "claimRewards",
}

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

export type Transaction = {
  data: TransactionData;
  encoded: string;
  signature: string;
  status: { errors: { message: string }[]; warnings: { message: string }[] };
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
  labels?: string[]; // To define the list of features supported
};
