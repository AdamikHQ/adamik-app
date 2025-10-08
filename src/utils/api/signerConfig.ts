/**
 * SIGNER-AGNOSTIC configuration management for all signers
 * Centralizes environment variable requirements and validation
 */

import { SignerType } from "~/signers/types";

interface SignerConfigSpec {
  required: string[];
  optional?: string[];
  description: string;
  healthCheck?: () => Promise<boolean>;
}

/**
 * Configuration specifications for each signer
 */
const SIGNER_CONFIGS: Record<SignerType, SignerConfigSpec> = {
  [SignerType.SODOT]: {
    required: [
      "SODOT_VERTEX_URL_0",
      "SODOT_VERTEX_API_KEY_0",
      "SODOT_VERTEX_URL_1",
      "SODOT_VERTEX_API_KEY_1",
      "SODOT_VERTEX_URL_2",
      "SODOT_VERTEX_API_KEY_2",
    ],
    optional: [
      "SODOT_EXISTING_ECDSA_KEY_IDS",
      "SODOT_EXISTING_ED25519_KEY_IDS",
    ],
    description: "Sodot MPC Signer (3 vertices required)",
  },
  
  [SignerType.IOFINNET]: {
    required: [
      "IOFINNET_BASE_URL",
      "IOFINNET_CLIENT_ID",
      "IOFINNET_CLIENT_SECRET",
      "IOFINNET_VAULT_ID",
    ],
    optional: [],
    description: "IoFinnet Vault Signer",
  },

  [SignerType.TURNKEY]: {
    required: [
      "TURNKEY_BASE_URL",
      "TURNKEY_API_PUBLIC_KEY",
      "TURNKEY_API_PRIVATE_KEY",
      "TURNKEY_ORGANIZATION_ID",
      "TURNKEY_WALLET_ID",
    ],
    optional: [],
    description: "Turnkey Signer",
  },

  [SignerType.BLOCKDAEMON]: {
    required: [
      "BLOCKDAEMON_TSM_ENDPOINT",
      "BLOCKDAEMON_PUBLIC_KEY",
      "BLOCKDAEMON_EXISTING_KEY_IDS",
    ],
    optional: [],
    description: "BlockDaemon TSM Signer",
  },

  [SignerType.DFNS]: {
    required: [
      "DFNS_BASE_URL",
      "DFNS_APP_ID",
      "DFNS_AUTH_TOKEN",
      "DFNS_WALLET_ID",
    ],
    optional: [],
    description: "DFNS Signer",
  },
};

/**
 * Get configuration spec for a signer
 */
export function getSignerConfig(signerType: SignerType): SignerConfigSpec {
  const config = SIGNER_CONFIGS[signerType];
  if (!config) {
    throw new Error(`Unknown signer type: ${signerType}`);
  }
  return config;
}

/**
 * Validate that all required environment variables are set for a signer
 */
export function validateSignerConfig(signerType: SignerType): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const config = getSignerConfig(signerType);
  
  // Check required variables
  const missing = config.required.filter(varName => !process.env[varName]);
  
  // Check optional variables for warnings
  const warnings: string[] = [];
  if (config.optional) {
    const missingOptional = config.optional.filter(varName => !process.env[varName]);
    if (missingOptional.length > 0) {
      warnings.push(`Optional variables not set: ${missingOptional.join(", ")}`);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get signer credentials safely (with validation)
 */
export function getSignerCredentials(signerType: SignerType): Record<string, string> {
  const validation = validateSignerConfig(signerType);
  
  if (!validation.valid) {
    throw new Error(
      `Missing required environment variables for ${signerType}: ${validation.missing.join(", ")}`
    );
  }
  
  const config = getSignerConfig(signerType);
  const credentials: Record<string, string> = {};
  
  // Collect all required and optional credentials
  [...config.required, ...(config.optional || [])].forEach(varName => {
    const value = process.env[varName];
    if (value) {
      credentials[varName] = value;
    }
  });
  
  return credentials;
}

/**
 * Check if a signer is properly configured
 */
export function isSignerConfigured(signerType: SignerType): boolean {
  try {
    const validation = validateSignerConfig(signerType);
    return validation.valid;
  } catch {
    return false;
  }
}

/**
 * Get all configured signers
 */
export function getConfiguredSigners(): SignerType[] {
  return Object.values(SignerType).filter(signer => isSignerConfigured(signer));
}

/**
 * Helper to get specific Sodot vertex configuration
 */
export function getSodotVertexConfig(vertexIndex: number): {
  url: string;
  apiKey: string;
} | null {
  const url = process.env[`SODOT_VERTEX_URL_${vertexIndex}`];
  const apiKey = process.env[`SODOT_VERTEX_API_KEY_${vertexIndex}`];
  
  if (!url || !apiKey) {
    return null;
  }
  
  return { url, apiKey };
}

/**
 * Helper to get IoFinnet configuration
 */
export function getIoFinnetConfig(): {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  vaultId: string;
} | null {
  const baseUrl = process.env.IOFINNET_BASE_URL;
  const clientId = process.env.IOFINNET_CLIENT_ID;
  const clientSecret = process.env.IOFINNET_CLIENT_SECRET;
  const vaultId = process.env.IOFINNET_VAULT_ID;
  
  if (!baseUrl || !clientId || !clientSecret || !vaultId) {
    return null;
  }
  
  return {
    baseUrl,
    clientId,
    clientSecret,
    vaultId,
  };
}

/**
 * Get existing key IDs for Sodot
 */
export function getSodotKeyIds(curveType: "ecdsa" | "ed25519"): string[] {
  const envVar = curveType === "ecdsa" 
    ? "SODOT_EXISTING_ECDSA_KEY_IDS"
    : "SODOT_EXISTING_ED25519_KEY_IDS";
  
  const keyIdsStr = process.env[envVar];
  if (!keyIdsStr) {
    return [];
  }
  
  return keyIdsStr.split(",").map(id => id.trim()).filter(Boolean);
}