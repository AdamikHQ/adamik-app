"use client";

import { IWallet } from "./types";
import { SDKProvider } from "@metamask/sdk";
import detectEthereumProvider from "@metamask/detect-provider";

export class MetamaskWallet implements IWallet {
  public id = "Metamask";
  public families = ["evm"];
  public icon = "/wallets/Metamask.svg";
  public withoutBroadcast = true;

  private ethereum: any;

  constructor(SDKProvider: any) {
    this.ethereum = SDKProvider;

    this.ethereum?.on("accountsChanged", (accounts: string[]) => {
      //Report here new accounts to UI
      console.log("accountsChanged", accounts);
    });

    this.connect();
  }

  static async initialize() {
    const ethereum = await detectEthereumProvider();

    return new MetamaskWallet(ethereum);
  }

  async connect() {
    if (this.isProviderAvailable(this.ethereum)) {
      try {
        await this.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error: any) {
        if (error.code === 4001) {
          console.log("User rejected request");
        }
      }
      return this.getAddresses();
    }
    return [];
  }

  async getAddresses(): Promise<string[]> {
    if (this.isProviderAvailable(this.ethereum)) {
      const accounts = (await this.ethereum.request({
        method: "eth_accounts",
      })) as string[];
      return accounts;
    }
    return [];
  }

  async getDiscoveryMethod() {
    return this.getAddresses();
  }

  private isProviderAvailable(
    ethereum: SDKProvider | undefined | null
  ): ethereum is SDKProvider {
    if (!ethereum) {
      return false;
    }
    return true;
  }
}
