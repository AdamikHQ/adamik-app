import { BaseSigner, SignerType } from "./types";
import { AdamikSignerSpec, AdamikCurve } from "~/utils/types";
import { SodotSigner } from "./Sodot";
import { IoFinnetSigner } from "./IoFinnet";
import { TurnkeySigner } from "./Turnkey";
import { BlockdaemonSigner } from "./Blockdaemon";
import { DfnsSigner } from "./Dfns";
import { getChains } from "~/api/adamik/chains";
import { compressPublicKey, doesChainNeedCompressedKey } from "~/utils/publicKeyUtils";

/**
 * SIGNER-AGNOSTIC Factory Pattern
 * 
 * This factory creates signer instances based on the selected type.
 * Components should NEVER instantiate signers directly - always use this factory.
 * This ensures complete signer abstraction throughout the application.
 */
export class SignerFactory {
  // Cache for IoFinnet pubkeys
  private static iofinnetPubkeys: {
    ecdsa?: string;
    eddsa?: string;
  } = {};
  /**
   * Create a signer instance based on the selected type
   * 
   * @param signerType - The type of signer to create
   * @param chainId - The blockchain chain ID
   * @param signerSpec - The Adamik signer specification
   * @returns A BaseSigner instance (specific implementation hidden)
   */
  static async createSigner(
    signerType: SignerType,
    chainId: string,
    signerSpec: AdamikSignerSpec
  ): Promise<BaseSigner> {
    // Get chain data for Turnkey
    const chains = await getChains();
    const chain = chains?.[chainId];
    
    switch (signerType) {
      case SignerType.SODOT:
        return new SodotSigner(chainId, signerSpec);
      
      case SignerType.IOFINNET:
        return new IoFinnetSigner(chainId, signerSpec);
      
      case SignerType.TURNKEY:
        if (!chain) {
          throw new Error(`Chain ${chainId} not found`);
        }
        return new TurnkeySigner(chainId, signerSpec, chain);
      
      case SignerType.BLOCKDAEMON:
        return new BlockdaemonSigner(chainId, signerSpec);
      
      case SignerType.DFNS:
        if (!chain) {
          throw new Error(`Chain ${chainId} not found`);
        }
        return new DfnsSigner(chainId, signerSpec, chain);
      
      default:
        throw new Error(`Unsupported signer type: ${signerType}`);
    }
  }

  /**
   * Get the currently selected signer type from localStorage
   * 
   * @returns The selected signer type, defaults to SODOT
   */
  static getSelectedSignerType(): SignerType {
    if (typeof window === "undefined") {
      console.log('[SignerFactory] SSR mode, returning default SODOT');
      return SignerType.SODOT; // Default for SSR
    }
    
    const saved = localStorage.getItem("preferredSigner") as SignerType;
    console.log('[SignerFactory] Getting selected signer:', {
      saved,
      isValid: saved && Object.values(SignerType).includes(saved),
      defaulting: !saved || !Object.values(SignerType).includes(saved)
    });
    
    if (saved && Object.values(SignerType).includes(saved)) {
      return saved;
    }
    
    return SignerType.SODOT; // Default
  }

  /**
   * Save the selected signer type to localStorage
   * 
   * @param signerType - The signer type to save
   */
  static setSelectedSignerType(signerType: SignerType): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredSigner", signerType);
    }
  }

  /**
   * Check if a signer type is properly configured
   * 
   * @param signerType - The signer type to check
   * @returns Whether the signer is configured
   */
  static isSignerConfigured(signerType: SignerType): boolean {
    // This is checked server-side via API proxies
    // For now, return true and let the proxy handle validation
    return true;
  }

  /**
   * Create a signer instance using the user's preferred signer
   * 
   * @param chainId - The blockchain chain ID
   * @param signerSpec - The Adamik signer specification
   * @returns A BaseSigner instance of the user's preferred type
   */
  static async createPreferredSigner(
    chainId: string,
    signerSpec: AdamikSignerSpec
  ): Promise<BaseSigner> {
    const signerType = this.getSelectedSignerType();
    return this.createSigner(signerType, chainId, signerSpec);
  }

  /**
   * Fetch and cache IoFinnet pubkeys (both ECDSA and EDDSA)
   */
  private static async fetchIofinnetPubkeys(): Promise<void> {
    if (this.iofinnetPubkeys.ecdsa && this.iofinnetPubkeys.eddsa) {
      return; // Already cached
    }

    try {
      // Fetch both pubkeys from IoFinnet
      const response = await fetch('/api/iofinnet-proxy/get-all-pubkeys', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch IoFinnet pubkeys');
      }

      const data = await response.json();
      
      // Extract pubkeys from the response
      if (data.publicKeys) {
        this.iofinnetPubkeys = {
          ecdsa: data.publicKeys.ECDSA_SECP256K1,
          eddsa: data.publicKeys.EDDSA_ED25519,
        };
      } else {
        throw new Error('Invalid response format from IoFinnet');
      }
    } catch (error) {
      console.error('Error fetching IoFinnet pubkeys:', error);
      throw error;
    }
  }

  /**
   * Get the public key for a chain using the selected signer
   * SIGNER-AGNOSTIC method that routes to the appropriate proxy
   * 
   * @param chainId - The chain to get the public key for
   * @param signerType - Optional signer type override
   * @returns The public key
   */
  static async getChainPubkey(
    chainId: string,
    signerType?: SignerType
  ): Promise<string> {
    const selectedSigner = signerType || this.getSelectedSignerType();
    
    if (selectedSigner === SignerType.SODOT) {
      // Sodot uses derive-chain-pubkey endpoint
      const response = await fetch(
        `/api/sodot-proxy/derive-chain-pubkey?chain=${chainId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get pubkey for ${chainId}`);
      }

      const data = await response.json();
      return data.data?.pubkey || data.pubkey;
    } else if (selectedSigner === SignerType.IOFINNET) {
      // Ensure pubkeys are cached
      await this.fetchIofinnetPubkeys();

      // Get chain data to determine which curve to use
      const chains = await getChains();
      if (!chains || !chains[chainId]) {
        throw new Error(`Chain ${chainId} not found`);
      }

      const chain = chains[chainId];
      const curve = chain.signerSpec?.curve;

      // Select the appropriate pubkey based on the chain's curve
      let pubkey: string | undefined;
      if (curve === AdamikCurve.ED25519) {
        pubkey = this.iofinnetPubkeys.eddsa;
      } else {
        // Default to ECDSA for secp256k1 and other curves
        pubkey = this.iofinnetPubkeys.ecdsa;
      }

      if (!pubkey) {
        throw new Error(`No ${curve} pubkey available for ${chainId}`);
      }

      // Log the chain and pubkey info for debugging
      console.log(`IoFinnet: Chain ${chainId} uses curve ${curve}, pubkey length: ${pubkey.length}`);
      if (chainId.includes('stellar')) {
        console.log(`IoFinnet: Stellar Ed25519 pubkey (hex): ${pubkey}`);
      }

      // Handle key compression for chains that need it
      // All Cosmos family and Bitcoin family chains need compressed keys
      const needsCompression = chain.family === 'cosmos' || 
                              chain.family === 'bitcoin';
      
      if (needsCompression && pubkey.startsWith('0x04')) {
        // Uncompressed ECDSA key, compress it
        const originalLength = pubkey.length;
        pubkey = compressPublicKey(pubkey);
        console.log(`IoFinnet: Compressed pubkey for ${chainId} (family: ${chain.family}) from ${originalLength} to ${pubkey.length}`);
      }

      // Handle 0x prefix based on chain requirements
      // ONLY EVM chains need the 0x prefix, all others don't
      const isEVMChain = chain.family === 'evm';
      
      if (!isEVMChain && pubkey.startsWith('0x')) {
        // Remove 0x prefix for all non-EVM chains
        pubkey = pubkey.slice(2);
        console.log(`IoFinnet: Removed 0x prefix for ${chainId} (${chain.family} chain)`);
      } else if (isEVMChain && !pubkey.startsWith('0x')) {
        // Add 0x prefix only for EVM chains
        pubkey = `0x${pubkey}`;
        console.log(`IoFinnet: Added 0x prefix for ${chainId} (EVM chain)`);
      }

      console.log(`IoFinnet: Final pubkey for ${chainId}: ${pubkey.substring(0, 20)}... (length: ${pubkey.length})`);
      return pubkey;
    } else if (selectedSigner === SignerType.TURNKEY) {
      // Get chain data to determine curve and coin type
      const chains = await getChains();
      if (!chains || !chains[chainId]) {
        throw new Error(`Chain ${chainId} not found`);
      }

      const chain = chains[chainId];
      const signerSpec = chain.signerSpec;
      
      if (!signerSpec) {
        throw new Error(`No signer spec for chain ${chainId}`);
      }

      // Fetch pubkey from Turnkey
      const response = await fetch('/api/turnkey-proxy/get-pubkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curve: signerSpec.curve,
          coinType: signerSpec.coinType,
          chainId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to get Turnkey pubkey for ${chainId}`);
      }

      const data = await response.json();
      let pubkey = data.pubkey;

      // Handle key compression for chains that need it
      const needsCompression = chain.family === 'cosmos' || 
                              chain.family === 'bitcoin';
      
      if (needsCompression && pubkey.startsWith('0x04')) {
        pubkey = compressPublicKey(pubkey);
        console.log(`Turnkey: Compressed pubkey for ${chainId}`);
      }

      // Handle 0x prefix based on chain requirements
      const isEVMChain = chain.family === 'evm';
      
      if (!isEVMChain && pubkey.startsWith('0x')) {
        pubkey = pubkey.slice(2);
        console.log(`Turnkey: Removed 0x prefix for ${chainId}`);
      } else if (isEVMChain && !pubkey.startsWith('0x')) {
        pubkey = `0x${pubkey}`;
        console.log(`Turnkey: Added 0x prefix for ${chainId}`);
      }

      console.log(`Turnkey: Final pubkey for ${chainId}: ${pubkey.substring(0, 20)}... (length: ${pubkey.length})`);
      return pubkey;
    } else if (selectedSigner === SignerType.BLOCKDAEMON) {
      // Get chain data to determine curve
      const chains = await getChains();
      if (!chains || !chains[chainId]) {
        throw new Error(`Chain ${chainId} not found`);
      }

      const chain = chains[chainId];
      const signerSpec = chain.signerSpec;
      
      if (!signerSpec) {
        throw new Error(`No signer spec for chain ${chainId}`);
      }

      // Fetch pubkey from BlockDaemon
      const response = await fetch('/api/blockdaemon-proxy/get-pubkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          curve: signerSpec.curve,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to get BlockDaemon pubkey for ${chainId}`);
      }

      const data = await response.json();
      let pubkey = data.publicKey;

      // BlockDaemon returns compressed keys by default
      // Handle 0x prefix based on chain requirements
      const isEVMChain = chain.family === 'evm';
      
      if (!isEVMChain && pubkey.startsWith('0x')) {
        pubkey = pubkey.slice(2);
        console.log(`BlockDaemon: Removed 0x prefix for ${chainId}`);
      } else if (isEVMChain && !pubkey.startsWith('0x')) {
        pubkey = `0x${pubkey}`;
        console.log(`BlockDaemon: Added 0x prefix for ${chainId}`);
      }

      console.log(`BlockDaemon: Final pubkey for ${chainId}: ${pubkey.substring(0, 20)}... (length: ${pubkey.length})`);
      return pubkey;
    } else if (selectedSigner === SignerType.DFNS) {
      // Get chain data to determine curve
      const chains = await getChains();
      if (!chains || !chains[chainId]) {
        throw new Error(`Chain ${chainId} not found`);
      }

      const chain = chains[chainId];
      const signerSpec = chain.signerSpec;
      
      if (!signerSpec) {
        throw new Error(`No signer spec for chain ${chainId}`);
      }

      // Fetch pubkey from DFNS
      const response = await fetch('/api/dfns-proxy/get-pubkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          curve: signerSpec.curve,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to get DFNS pubkey for ${chainId}`);
      }

      const data = await response.json();
      let pubkey = data.publicKey;

      // Handle Starknet public key formatting
      if (signerSpec.curve === "stark") {
        // Strip leading zeros for Starknet
        const hex = pubkey.startsWith("0x") ? pubkey.substring(2) : pubkey;
        const stripped = hex.replace(/^0+/, "") || "0"; // Keep at least one 0
        pubkey = `0x${stripped}`;
      }

      // Handle key compression for chains that need it
      const needsCompression = chain.family === 'cosmos' || 
                              chain.family === 'bitcoin';
      
      if (needsCompression && pubkey.startsWith('0x04')) {
        pubkey = compressPublicKey(pubkey);
        console.log(`DFNS: Compressed pubkey for ${chainId}`);
      }

      // Handle 0x prefix based on chain requirements
      const isEVMChain = chain.family === 'evm';
      
      if (!isEVMChain && pubkey.startsWith('0x')) {
        pubkey = pubkey.slice(2);
        console.log(`DFNS: Removed 0x prefix for ${chainId}`);
      } else if (isEVMChain && !pubkey.startsWith('0x')) {
        pubkey = `0x${pubkey}`;
        console.log(`DFNS: Added 0x prefix for ${chainId}`);
      }

      console.log(`DFNS: Final pubkey for ${chainId}: ${pubkey.substring(0, 20)}... (length: ${pubkey.length})`);
      return pubkey;
    } else {
      throw new Error(`Unsupported signer type: ${selectedSigner}`);
    }
  }
}