export interface IWallet {
  id: string;
  families: string[];
  connect: () => Promise<string[]>;
  getAddresses: () => Promise<string[]>;
  getDiscoveryMethod?: () => Promise<string[]>; // pubKey for cosmos, address for ethereum
}

export type Address = {
  chainId: string;
  address: string;
};
