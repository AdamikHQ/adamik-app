export const etherumNetworkConfig: Record<string, any> = {
  sepolia: {
    adamikChainId: "sepolia",
    chainId: "0xaa36a7",
    chainName: "Sepolia",
    rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
    explorerUrl: (hash: string) => `https://sepolia.etherscan.io/tx/${hash}`,
    isTestnet: true,
  },
  holesky: {
    adamikChainId: "holesky",
    chainId: "0x4268",
    chainName: "Holesky",
    rpcUrls: ["https://ethereum-holesky-rpc.publicnode.com"],
    explorerUrl: (hash: string) => `https://holesky.etherscan.io/tx/${hash}`,
    isTestnet: true,
  },
  ethereum: {
    adamikChainId: "ethereum",
    chainId: "0x1",
    chainName: "Ethereum",
    rpcUrls: ["https://eth.llamarpc.com"],
    explorerUrl: (hash: string) => `https://etherscan.io/tx/${hash}`,
  },
  zksync: {
    adamikChainId: "zksync",
    chainId: "0x144",
    chainName: "zkSync",
    rpcUrls: ["https://zksync.drpc.org"],
    explorerUrl: (hash: string) => `https://explorer.zksync.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },
  "zksync-sepolia": {
    adamikChainId: "zksync-sepolia",
    chainId: "0x12c",
    chainName: "zkSync Sepolia",
    rpcUrls: ["https://sepolia.era.zksync.dev"],
    explorerUrl: (hash: string) =>
      `https://sepolia.explorer.zksync.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    isTestnet: true,
  },
  "injective-testnet": {
    adamikChainId: "injective-testnet",
    chainId: "0x978",
    chainName: "zkSync Sepolia",
    rpcUrls: ["https://testnet.rpc.inevm.com/http"],
    explorerUrl: (hash: string) =>
      `https://inevm-testnet.explorer.caldera.xyz/tx/${hash}`,
    nativeCurrency: {
      name: "Injective",
      symbol: "INJ",
      decimals: 18,
    },
    isTestnet: true,
  },
  base: {
    adamikChainId: "base",
    chainId: "0x2105",
    chainName: "Base",
    rpcUrls: ["https://mainnet.base.org"],
    explorerUrl: (hash: string) => `https://basescan.org/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  "base-sepolia": {
    adamikChainId: "base-sepolia",
    chainId: "0x14A34",
    chainName: "Base Sepolia",
    rpcUrls: ["https://sepolia.base.org"],
    explorerUrl: (hash: string) => `https://sepolia.basescan.org/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    isTestnet: true,
  },
  optimism: {
    adamikChainId: "optimism",
    chainId: "0xA",
    chainName: "Optimism",
    rpcUrls: ["https://mainnet.optimism.io"],
    explorerUrl: (hash: string) => `https://optimistic.etherscan.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  "optimism-sepolia": {
    adamikChainId: "optimism-sepolia",
    chainId: "0xAA37DC",
    chainName: "Optimism Sepolia",
    rpcUrls: ["https://sepolia.optimism.io"],
    explorerUrl: (hash: string) =>
      `https://sepolia-optimistic.etherscan.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    isTestnet: true,
  },
  arbitrum: {
    adamikChainId: "arbitrum",
    chainId: "0xa4b1",
    chainName: "Arbitrum One",
    rpcUrls: ["https://arbitrum-mainnet.infura.io"],
    explorerUrl: (hash: string) => `https://arbiscan.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  "arbitrum-sepolia": {
    adamikChainId: "arbitrum-sepolia",
    chainId: "0x66eee",
    chainName: "Arbitrum Sepolia",
    rpcUrls: ["https://arbitrum-sepolia.blockpi.network/v1/rpc/public"],
    explorerUrl: (hash: string) => `https://sepolia.arbiscan.io/tx/${hash}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    isTestnet: true,
  },
  bsc: {
    adamikChainId: "bsc",
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    explorerUrl: (hash: string) => `https://bscscan.com/tx/${hash}`,
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
  },
};
