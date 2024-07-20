import { TransactionEncodeResponse } from "~/api/adamik/encode";

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

// FIXME Name is confusing, address should not contain address :)
export type Address = {
  chainId: string;
  address: string;
  pubKey?: string;
  signer?: string;
};

export enum WalletName {
  METAMASK = "metamask",
  KEPLR = "keplr",
  PERA = "pera",
}

export type WalletConnectorProps = {
  transactionPayload?: TransactionEncodeResponse;
};
