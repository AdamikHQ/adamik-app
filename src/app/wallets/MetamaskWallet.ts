"use client";

import { IWallet } from "./types";
import { SDKProvider } from "@metamask/sdk";
import detectEthereumProvider from "@metamask/detect-provider";

export class MetamaskWallet implements IWallet {
  public id = "Metamask";
  public families = ["evm"];
  public icon = "/wallets/Metamask.svg";
  public withoutBroadcast = true;

  private metamaskSDK: any;

  constructor(SDKProvider: any) {
    this.metamaskSDK = SDKProvider;

    this.metamaskSDK?.on("accountsChanged", (accounts: string[]) => {
      //Report here new accounts to UI
      console.log("accountsChanged", accounts);
    });

    this.connect();
  }

  static async initialize() {
    const metamaskSDK = await detectEthereumProvider();

    return new MetamaskWallet(metamaskSDK);
  }

  async connect() {
    if (this.isProviderAvailable(this.metamaskSDK)) {
      try {
        await this.metamaskSDK.request({ method: "eth_requestAccounts" });
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
    if (this.isProviderAvailable(this.metamaskSDK)) {
      const accounts = (await this.metamaskSDK.request({
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
    metamaskSDK: SDKProvider | undefined | null
  ): metamaskSDK is SDKProvider {
    if (!metamaskSDK) {
      return false;
    }
    return true;
  }
}
