import { AdamikSignerSpec } from "~/utils/types";

// Base interface from adamik-link
export interface BaseSigner {
  signerSpec: AdamikSignerSpec;
  signerName: string;
  chainId: string;

  getAddress(): Promise<string>;
  getPubkey(): Promise<string>;
  signTransaction(encodedMessage: string): Promise<string>;
  signHash?(hash: string): Promise<string>;
}

// Signer types available in the app
export enum SignerType {
  SODOT = "sodot",
  IOFINNET = "iofinnet",
  // Future signers can be added here
  // TURNKEY = "turnkey",
  // DFNS = "dfns",
}

// Configuration for each signer
export interface SignerConfig {
  type: SignerType;
  displayName: string;
  description: string;
  icon?: string;
  requiresSetup: boolean;
  setupInstructions?: string;
  supportedCurves: string[];
  supportedChains?: string[];
}

// Registry of available signers
export const SIGNER_CONFIGS: Record<SignerType, SignerConfig> = {
  [SignerType.SODOT]: {
    type: SignerType.SODOT,
    displayName: "Sodot MPC",
    description: "Secure multi-party computation with 2-of-3 threshold",
    requiresSetup: false,
    supportedCurves: ["secp256k1", "ed25519"],
  },
  [SignerType.IOFINNET]: {
    type: SignerType.IOFINNET,
    displayName: "IoFinnet",
    description: "Enterprise MPC signing with approval workflows",
    requiresSetup: true,
    setupInstructions: "Requires IoFinnet vault configuration",
    supportedCurves: ["secp256k1"],
  },
};