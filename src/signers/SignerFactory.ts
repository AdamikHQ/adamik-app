import { BaseSigner, SignerType } from "./types";
import { AdamikSignerSpec } from "~/utils/types";
import { SodotSigner } from "./Sodot";
import { IoFinnetSigner } from "./IoFinnet";

/**
 * SIGNER-AGNOSTIC Factory Pattern
 * 
 * This factory creates signer instances based on the selected type.
 * Components should NEVER instantiate signers directly - always use this factory.
 * This ensures complete signer abstraction throughout the application.
 */
export class SignerFactory {
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
    switch (signerType) {
      case SignerType.SODOT:
        return new SodotSigner(chainId, signerSpec);
      
      case SignerType.IOFINNET:
        return new IoFinnetSigner(chainId, signerSpec);
      
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
      return SignerType.SODOT; // Default for SSR
    }
    
    const saved = localStorage.getItem("preferredSigner") as SignerType;
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
}