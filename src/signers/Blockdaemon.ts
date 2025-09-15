import { BaseSigner } from "./types";
import { AdamikSignerSpec } from "~/utils/types";

export class BlockdaemonSigner implements BaseSigner {
  public chainId: string;
  public signerSpec: AdamikSignerSpec;
  public signerName = "blockdaemon";
  
  private cachedPublicKey: string | null = null;
  private cachedAddress: string | null = null;
  private keyId: string | null = null;

  constructor(chainId: string, signerSpec: AdamikSignerSpec) {
    this.chainId = chainId;
    this.signerSpec = signerSpec;
    
    // Try to get key ID from localStorage first (client-side persistence)
    if (typeof window !== 'undefined') {
      const storedKeyId = localStorage.getItem('blockdaemon_key_id');
      if (storedKeyId) {
        this.keyId = storedKeyId;
        console.log('[BlockdaemonSigner] Loaded keyId from localStorage:', this.keyId);
      }
    }
    
    // Fallback to environment variable if available
    if (!this.keyId) {
      this.keyId = process.env.NEXT_PUBLIC_BLOCKDAEMON_KEY_ID || null;
      console.log('[BlockdaemonSigner] Using env keyId:', this.keyId);
    }
  }

  async getAddress(): Promise<string> {
    if (this.cachedAddress) {
      return this.cachedAddress;
    }

    const pubkey = await this.getPubkey();
    
    // Get address from Adamik API
    const response = await fetch("/api/sodot-proxy/derive-chain-pubkey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chain: this.chainId,
        pubkey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get address for chain ${this.chainId}`);
    }

    const data = await response.json();
    const address = data.data?.address || data.address;
    
    if (!address) {
      throw new Error(`No address returned for chain ${this.chainId}`);
    }

    this.cachedAddress = address;
    return address;
  }

  async getPubkey(): Promise<string> {
    if (this.cachedPublicKey) {
      return this.cachedPublicKey;
    }

    try {
      // Make API call to get or generate public key
      const response = await fetch("/api/blockdaemon-proxy/get-pubkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId: this.chainId,
          curve: this.signerSpec.curve,
          keyId: this.keyId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get public key: ${error}`);
      }

      const data = await response.json();
      this.cachedPublicKey = data.publicKey;
      
      // Update and persist keyId if returned
      if (data.keyId) {
        this.keyId = data.keyId;
        console.log('[BlockdaemonSigner] Received keyId from server:', this.keyId);
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('blockdaemon_key_id', data.keyId);
        }
      }
      
      return data.publicKey;
    } catch (error) {
      console.error("BlockDaemon getPubkey error:", error);
      throw error;
    }
  }

  async signTransaction(encodedMessage: string): Promise<string> {
    try {
      // Ensure we have a key ID before signing
      if (!this.keyId) {
        // Try to get public key first which will set the keyId
        await this.getPubkey();
        
        if (!this.keyId) {
          throw new Error("No key ID available for signing. Please connect wallet first.");
        }
      }
      
      const requestBody = {
        chainId: this.chainId,
        message: encodedMessage,
        keyId: this.keyId,
        curve: this.signerSpec.curve,
        hashFunction: this.signerSpec.hashFunction,
        signatureFormat: this.signerSpec.signatureFormat,
      };
      
      console.log('[BlockdaemonSigner] Signing transaction with:', {
        chainId: this.chainId,
        keyId: this.keyId,
        curve: this.signerSpec.curve,
        hashFunction: this.signerSpec.hashFunction,
        signatureFormat: this.signerSpec.signatureFormat,
        messageLength: encodedMessage?.length
      });
      
      const response = await fetch("/api/blockdaemon-proxy/sign-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Failed to sign transaction: ${response.statusText}`);
      }

      const data = await response.json();
      return data.signature;
    } catch (error) {
      console.error("BlockDaemon signTransaction error:", error);
      throw error;
    }
  }

  async signHash(hash: string): Promise<string> {
    try {
      const response = await fetch("/api/blockdaemon-proxy/sign-hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId: this.chainId,
          hash,
          keyId: this.keyId,
          curve: this.signerSpec.curve,
          signatureFormat: this.signerSpec.signatureFormat,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to sign hash: ${error}`);
      }

      const data = await response.json();
      return data.signature;
    } catch (error) {
      console.error("BlockDaemon signHash error:", error);
      throw error;
    }
  }
}