type Contract = {
  address: string;
  blockchain: string;
  blockchainId: string;
  decimals: number;
};

export type MobulaMarketData = {
  market_cap: number;
  market_cap_diluted: number;
  liquidity: number;
  price: number;
  off_chain_volume: number;
  volume: number;
  volume_change_24h: number;
  volume_7d: number;
  is_listed: boolean;
  price_change_24h: number;
  price_change_1h: number;
  price_change_7d: number;
  price_change_1m: number;
  price_change_1y: number;
  ath: number;
  atl: number;
  rank: number;
  logo: string;
  name: string;
  symbol: string;
  contracts: Contract[];
  total_supply: string;
  circulating_supply: string;
};

export interface MobulaBlockchain {
  name: string;
  logo: string;
  chainId: string;
  evmChainId: number;
  rpcs: string[];
  explorer: string;
  uniswapV3Factory: string[];
  multicall_contract: string;
  eth: {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
    type: string;
    logo: string;
    id: number;
  };
  stable: {
    symbol: string;
    name: string;
    logo: string;
    blockchains: string[];
    contracts: string[];
    blockchain: string;
    address: string;
    decimals: number;
    type: string;
  };
  routers: Router[];
  tokens: Token[];
  supportedProtocols: string[];
  color: string;
  dexscreenerChain: string;
  coverage: string[];
}

interface Router {
  name: string;
  address: string;
  factory: string;
  fee: number;
}

interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  type: string;
}
