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
  TURNKEY = "turnkey",
  BLOCKDAEMON = "blockdaemon",
  // Future signers can be added here
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
    supportedCurves: ["secp256k1", "ed25519"],
  },
  [SignerType.TURNKEY]: {
    type: SignerType.TURNKEY,
    displayName: "Turnkey",
    description: "Cloud-based key management with flexible wallet infrastructure",
    requiresSetup: true,
    setupInstructions: "Requires Turnkey organization and wallet configuration",
    supportedCurves: ["secp256k1", "ed25519"],
  },
  [SignerType.BLOCKDAEMON]: {
    type: SignerType.BLOCKDAEMON,
    displayName: "BlockDaemon Vault",
    description: "Enterprise-grade TSM with multi-party computation",
    requiresSetup: true,
    setupInstructions: "Requires BlockDaemon Vault TSM certificates and configuration",
    supportedCurves: ["secp256k1"],
  },
};