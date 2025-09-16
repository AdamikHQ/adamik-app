import { BaseSigner } from "./types";
import { Chain } from "~/utils/types";
import { compressPublicKey } from "~/utils/publicKeyUtils";

export class DfnsSigner implements BaseSigner {
  public chainId: string;
  public signerSpec: any;
  public signerName = "DFNS";
  private chain: Chain;
  private walletId: string | undefined;
  private pubKey: string | undefined;

  constructor(chainId: string, signerSpec: any, chain: Chain) {
    console.log("Initializing DFNS signer for chain:", chainId);
    this.chainId = chainId;
    this.signerSpec = signerSpec;
    this.chain = chain;
  }

  async getAddress(): Promise<string> {
    // For DFNS, we'll get the address from the chain data
    // This is handled by the Adamik API
    const pubKey = await this.getPubkey();
    
    // The address derivation is handled by Adamik API
    // based on the public key and chain
    return "";
  }

  async getPubkey(): Promise<string> {
    // Return cached public key if available
    if (this.pubKey) {
      return this.pubKey;
    }

    console.log("Getting DFNS public key for chain:", this.chainId);

    try {
      // In browser environment, use API proxy
      const response = await fetch("/api/dfns-proxy/get-pubkey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chainId: this.chainId,
          curve: this.signerSpec.curve,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get DFNS public key: ${error}`);
      }

      const data = await response.json();
      this.walletId = data.walletId;
      let publicKey = data.publicKey;

      // Handle Starknet public key formatting
      if (this.signerSpec.curve === "stark") {
        // Strip leading zeros for Starknet
        const hex = publicKey.substring(2);
        const stripped = hex.replace(/^0+/gm, "");
        publicKey = `0x${stripped}`;
      }

      // Apply compression based on chain requirements
      const requiresCompression = this.chain.family === 'cosmos' || 
                                  this.chain.family === 'bitcoin';

      if (requiresCompression && this.signerSpec.curve === "secp256k1") {
        publicKey = compressPublicKey(publicKey);
      }

      this.pubKey = publicKey;
      return publicKey;
    } catch (error) {
      console.error("Error getting DFNS public key:", error);
      throw error;
    }
  }

  async signTransaction(encodedMessage: string): Promise<string> {
    if (!this.walletId) {
      // Get public key first to ensure wallet is created
      await this.getPubkey();
    }

    console.log("Signing transaction with DFNS");
    
    try {
      const response = await fetch("/api/dfns-proxy/sign-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chainId: this.chainId,
          walletId: this.walletId,
          encodedMessage,
          signerSpec: this.signerSpec,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to sign with DFNS: ${error}`);
      }

      const data = await response.json();
      return data.signature;
    } catch (error) {
      console.error("Error signing with DFNS:", error);
      throw error;
    }
  }

  async signHash(hash: string): Promise<string> {
    if (!this.walletId) {
      // Get public key first to ensure wallet is created
      await this.getPubkey();
    }

    console.log("Signing hash with DFNS");
    
    try {
      const response = await fetch("/api/dfns-proxy/sign-hash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chainId: this.chainId,
          walletId: this.walletId,
          hash,
          signerSpec: this.signerSpec,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to sign hash with DFNS: ${error}`);
      }

      const data = await response.json();
      return data.signature;
    } catch (error) {
      console.error("Error signing hash with DFNS:", error);
      throw error;
    }
  }
}