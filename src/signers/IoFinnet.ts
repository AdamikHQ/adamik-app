import { BaseSigner } from "./types";
import { AdamikSignerSpec } from "~/utils/types";

/**
 * IoFinnet signer implementation for Adamik
 * 
 * SIGNER-AGNOSTIC: This class encapsulates all IoFinnet-specific logic
 * External components only interact through the BaseSigner interface
 */
export class IoFinnetSigner implements BaseSigner {
  public chainId: string;
  public signerSpec: AdamikSignerSpec;
  public signerName = "IoFinnet";
  
  private accessToken: string | undefined;
  private vaultId: string;
  private baseUrl: string;

  constructor(chainId: string, signerSpec: AdamikSignerSpec) {
    this.chainId = chainId;
    this.signerSpec = signerSpec;
    this.vaultId = process.env.NEXT_PUBLIC_IOFINNET_VAULT_ID || "";
    this.baseUrl = "/api/iofinnet-proxy"; // Use proxy for all API calls
  }

  /**
   * Get the public key for the current chain
   * Uses the proxy to fetch from IoFinnet
   */
  async getPubkey(): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/get-pubkey?chain=${this.chainId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get public key");
      }

      const data = await response.json();
      return data.pubkey;
    } catch (error: any) {
      console.error("[IoFinnet] Error getting pubkey:", error);
      throw new Error(`Failed to get pubkey: ${error.message}`);
    }
  }

  /**
   * Get the address for the current chain
   * Derives from pubkey using Adamik API
   */
  async getAddress(): Promise<string> {
    try {
      // First get the pubkey
      const pubkey = await this.getPubkey();
      
      // Use Adamik API to encode pubkey to address
      const { encodePubKeyToAddress } = await import("~/api/adamik/encode");
      const { address } = await encodePubKeyToAddress(pubkey, this.chainId);
      
      return address;
    } catch (error: any) {
      console.error("[IoFinnet] Error getting address:", error);
      throw new Error(`Failed to get address: ${error.message}`);
    }
  }

  /**
   * Sign a transaction using IoFinnet's MPC
   */
  async signTransaction(encodedMessage: string): Promise<string> {
    try {
      // Ensure the message is properly formatted
      let formattedMsg = encodedMessage;
      if (formattedMsg.startsWith("0x")) {
        formattedMsg = formattedMsg.substring(2);
      }

      const response = await fetch(
        `${this.baseUrl}/sign-transaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chain: this.chainId,
            message: formattedMsg,
            signerSpec: this.signerSpec,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sign transaction");
      }

      const data = await response.json();
      return data.signature;
    } catch (error: any) {
      console.error("[IoFinnet] Error signing transaction:", error);
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  /**
   * Sign a hash directly (optional method)
   */
  async signHash?(hash: string): Promise<string> {
    return this.signTransaction(hash);
  }

  /**
   * Check if the signer is properly configured
   */
  static isConfigured(): boolean {
    // Check if IoFinnet environment variables are set
    // These are checked server-side in the proxy
    return true; // Proxy will handle the actual validation
  }
}