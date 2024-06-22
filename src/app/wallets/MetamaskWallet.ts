"use client";

import { IWallet } from "./types";
import { SDKProvider } from "@metamask/sdk";
import detectEthereumProvider from "@metamask/detect-provider";

export class MetamaskWallet implements IWallet {
  public id = "Metamask";
  public families = ["evm"];

  private ethereum: SDKProvider | null | undefined;

  constructor() {
    this.init();
  }

  private async init() {
    this.ethereum = await detectEthereumProvider();

    this.ethereum?.on("accountsChanged", (accounts) => {
      //Report here new accounts to UI
      console.log("accountsChanged", accounts);
    });
    this.connect();
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
