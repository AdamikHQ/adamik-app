import { Transaction } from "~/utils/types";

declare global {
  interface Window {
    unisat: UnisatWalletInterface;
    litescribe: UnisatWalletInterface; // this is a fork of Unisat, hence the same interface
  }
}

export interface IWallet {
  id: string;
  families: string[];
  icon: string;
  connect: () => Promise<string[]>;
  getAddresses: () => Promise<string[]>;
  getPubkey: () => Promise<string>;
  signTransaction: (encodedMessage: string) => Promise<string>;
}

export type Account = {
  chainId: string;
  address: string;
  pubKey?: string;
  signer?: string;
};

export enum WalletName {
  SODOT = "sodot",
  IOFINNET = "iofinnet",
  KEPLR = "keplr",
}

export type WalletConnectorProps = {
  chainId?: string;
  transactionPayload?: Transaction;
};

/**
 * Unisat Wallet Interface types from {@link https://github.com/unisat-wallet/extension/blob/04cbfd6e7f7953815d35d8f77df457388fea2707/src/background/controller/wallet.ts}
 * */
export type UnisatWalletInterface = {
  signPsbt(psbtHex: string): Promise<string>;
  disconnect(): Promise<void>;
  requestAccounts(): Promise<string[]>;
};
