export interface IWallet {
  id: string;
  families: string[];
  icon: string;
  withoutBroadcast: boolean;
  connect: () => Promise<string[]>;
  getAddresses: () => Promise<string[]>;
  getDiscoveryMethod?: () => Promise<string[]>; // pubKey for cosmos, address for ethereum
  changeAddressEvent?: (callback: (address: string) => void) => void;
}

export type Address = {
  chainId: string;
  address: string;
};
