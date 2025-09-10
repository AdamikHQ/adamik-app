import { BaseSigner } from "./types";
import { AdamikSignerSpec } from "~/utils/types";

/**
 * IoFinnet signer implementation for Adamik
 * 
 * SIGNER-AGNOSTIC: This class encapsulates all IoFinnet-specific logic
 * External components only interact through the BaseSigner interface
 * 
 * IoFinnet only has two public keys:
 * - ECDSA_SECP256K1: Used for most chains (Bitcoin, Ethereum, Cosmos, etc.)
 * - EDDSA_ED25519: Used for ED25519 chains (Algorand, Solana, Stellar)
 */
export class IoFinnetSigner implements BaseSigner {
  public chainId: string;
  public signerSpec: AdamikSignerSpec;
  public signerName = "IoFinnet";
  
  private accessToken: string | undefined;
  private vaultId: string;
  private baseUrl: string;
  
  // Cache for public keys (only two exist in IoFinnet)
  private static publicKeysCache: Record<string, string> | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(chainId: string, signerSpec: AdamikSignerSpec) {
    this.chainId = chainId;
    this.signerSpec = signerSpec;
    this.vaultId = process.env.NEXT_PUBLIC_IOFINNET_VAULT_ID || "";
    this.baseUrl = "/api/iofinnet-proxy"; // Use proxy for all API calls
  }

  /**
   * Fetch and cache all public keys from IoFinnet
   * IoFinnet only has two keys: ECDSA_SECP256K1 and EDDSA_ED25519
   */
  private async fetchAllPublicKeys(): Promise<Record<string, string>> {
    // Check cache first
    const now = Date.now();
    if (IoFinnetSigner.publicKeysCache && 
        (now - IoFinnetSigner.cacheTimestamp) < IoFinnetSigner.CACHE_DURATION) {
      return IoFinnetSigner.publicKeysCache;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/get-all-pubkeys`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get public keys");
      }

      const data = await response.json();
      IoFinnetSigner.publicKeysCache = data.publicKeys;
      IoFinnetSigner.cacheTimestamp = now;
      
      return data.publicKeys;
    } catch (error: any) {
      console.error("[IoFinnet] Error fetching all pubkeys:", error);
      throw new Error(`Failed to fetch public keys: ${error.message}`);
    }
  }

  /**
   * Determine which curve type a chain uses based on its signer spec
   * The signer spec from Adamik contains the curve information
   */
  private getCurveTypeForChain(): string {
    // Check the signer spec curve field from Adamik
    // The signerSpec.curve can be "ed25519" or "secp256k1"
    if (this.signerSpec.curve === "ed25519") {
      return "EDDSA_ED25519";
    }
    
    // Default to ECDSA for secp256k1 curve
    // This includes Bitcoin, Ethereum, Cosmos, etc.
    return "ECDSA_SECP256K1";
  }

  /**
   * Get the public key for the current chain
   * Fetches all public keys once and returns the appropriate one based on the chain's curve
   */
  async getPubkey(): Promise<string> {
    try {
      // Fetch all public keys (cached)
      const allPublicKeys = await this.fetchAllPublicKeys();
      
      // Determine which curve this chain uses based on its signer spec
      const curveType = this.getCurveTypeForChain();
      
      const pubkey = allPublicKeys[curveType];
      if (!pubkey) {
        throw new Error(`No public key found for curve type: ${curveType}`);
      }
      
      // Process the public key for the specific chain (compress if needed)
      const { processPublicKeyForChain } = await import("~/utils/publicKeyUtils");
      const processedPubkey = processPublicKeyForChain(pubkey, this.chainId);
      
      // For compressed keys (Bitcoin/Cosmos), don't add 0x prefix
      // Adamik expects compressed keys without prefix
      const isCompressed = processedPubkey.length === 66 && 
        (processedPubkey.startsWith('02') || processedPubkey.startsWith('03'));
      
      const finalPubkey = isCompressed 
        ? processedPubkey 
        : (processedPubkey.startsWith('0x') ? processedPubkey : `0x${processedPubkey}`);
      
      
      return finalPubkey;
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