import { SignerType } from "~/signers/types";
import { Chain } from "~/utils/types";

/**
 * Determines if a chain is compatible with a given signer based on the curve type
 * 
 * @param chain - The chain to check
 * @param signerType - The signer type to check compatibility for
 * @returns true if the chain is compatible with the signer
 */
export function isChainCompatibleWithSigner(
  chain: Chain,
  signerType: SignerType
): boolean {
  // Get the curve type from the chain's signer spec
  // The chain data from Adamik has it at chain.signerSpec.curve
  const curve = (chain as any).signerSpec?.curve;
  
  // If no curve info, assume it's compatible (don't block chains without curve info)
  if (!curve) {
    console.warn(`No curve information for chain ${chain.id}, assuming compatible`);
    return true; // Changed to true to not block chains without curve info
  }
  
  switch (signerType) {
    case SignerType.SODOT:
    case SignerType.IOFINNET:
    case SignerType.TURNKEY:
      // These signers support both secp256k1 and ed25519
      return curve === "secp256k1" || curve === "ed25519";
      
    case SignerType.BLOCKDAEMON:
      // BlockDaemon only supports secp256k1
      return curve === "secp256k1";
      
    case SignerType.DFNS:
      // DFNS supports secp256k1, ed25519, and stark curves
      return curve === "secp256k1" || curve === "ed25519" || curve === "stark";

    default:
      // Unknown signer, assume basic support
      return curve === "secp256k1" || curve === "ed25519";
  }
}

/**
 * Filters a list of chains to only include those compatible with the given signer
 * 
 * @param chains - The chains to filter
 * @param signerType - The signer type to filter for
 * @returns Only the chains compatible with the signer
 */
export function filterChainsForSigner(
  chains: Record<string, Chain>,
  signerType: SignerType
): Record<string, Chain> {
  const filtered: Record<string, Chain> = {};
  
  Object.entries(chains).forEach(([chainId, chain]) => {
    if (isChainCompatibleWithSigner(chain, signerType)) {
      filtered[chainId] = chain;
    }
  });
  
  return filtered;
}

/**
 * Gets a human-readable description of supported curves for a signer
 * 
 * @param signerType - The signer type
 * @returns Description of supported curves
 */
export function getSignerSupportedCurves(signerType: SignerType): string {
  switch (signerType) {
    case SignerType.SODOT:
    case SignerType.IOFINNET:
    case SignerType.TURNKEY:
      return "ECDSA (secp256k1) and EdDSA (ed25519)";
      
    case SignerType.BLOCKDAEMON:
      return "ECDSA (secp256k1) only";
      
    case SignerType.DFNS:
      return "ECDSA (secp256k1), EdDSA (ed25519), and STARK";
      
    default:
      return "ECDSA (secp256k1) and EdDSA (ed25519)";
  }
}

/**
 * Gets the incompatibility reason for a chain and signer combination
 * 
 * @param chain - The chain to check
 * @param signerType - The signer type
 * @returns Reason why the chain is incompatible, or null if compatible
 */
export function getIncompatibilityReason(
  chain: Chain,
  signerType: SignerType
): string | null {
  // Get the curve type from the chain's signer spec
  const curve = (chain as any).signerSpec?.curve;
  
  if (!curve) {
    return null; // No reason to show incompatibility if no curve info
  }
  
  if (isChainCompatibleWithSigner(chain, signerType)) {
    return null; // Compatible
  }
  
  // Generate specific incompatibility messages
  if (signerType === SignerType.BLOCKDAEMON && curve === "ed25519") {
    return "BlockDaemon does not support EdDSA (ed25519) curves";
  }
  
  if (curve === "stark" && signerType !== SignerType.DFNS) {
    return `${signerType} does not support STARK curves`;
  }
  
  return `${signerType} does not support ${curve} curve`;
}