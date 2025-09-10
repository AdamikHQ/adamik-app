/**
 * Public key utility functions for handling different key formats
 * Required for Bitcoin and Cosmos chains which need compressed keys
 */

/**
 * Compress an uncompressed SECP256K1 public key
 * 
 * Converts a 65-byte uncompressed public key (starting with 0x04)
 * to a 33-byte compressed public key (starting with 0x02 or 0x03)
 * 
 * @param uncompressedKey - Uncompressed public key as hex string or Buffer
 * @returns Compressed public key as hex string
 */
export function compressPublicKey(uncompressedKey: string | Buffer): string {
  // Convert to Buffer if hex string
  const keyBuffer = typeof uncompressedKey === 'string' 
    ? Buffer.from(uncompressedKey.replace(/^0x/i, ''), 'hex')
    : uncompressedKey;
  
  // Check if already compressed
  if (keyBuffer.length === 33 && (keyBuffer[0] === 0x02 || keyBuffer[0] === 0x03)) {
    return keyBuffer.toString('hex');
  }
  
  // Validate uncompressed format
  if (keyBuffer.length !== 65 || keyBuffer[0] !== 0x04) {
    throw new Error("Invalid uncompressed public key format");
  }
  
  // Extract x and y coordinates
  const x = keyBuffer.slice(1, 33);
  const y = keyBuffer.slice(33, 65);
  
  // Determine prefix based on y coordinate parity (even = 0x02, odd = 0x03)
  const prefix = (y[y.length - 1] & 1) === 0 ? 0x02 : 0x03;
  
  // Create compressed key
  const compressed = Buffer.concat([Buffer.from([prefix]), x]);
  
  return compressed.toString('hex');
}

/**
 * Determine if a chain needs compressed public keys
 * 
 * Bitcoin and Cosmos ecosystem chains require compressed keys for proper
 * address derivation with the Adamik API
 * 
 * @param chainId - The chain identifier
 * @returns true if the chain needs compressed keys
 */
export function doesChainNeedCompressedKey(chainId: string): boolean {
  // Bitcoin and Bitcoin testnet need compressed keys
  if (chainId === "bitcoin" || chainId === "bitcoin-testnet") {
    return true;
  }
  
  // Cosmos ecosystem chains need compressed keys for Adamik address derivation
  const cosmosChains = [
    "cosmoshub", "cosmos", "osmosis", "juno", "stargaze", "akash", 
    "sentinel", "persistence", "iris", "crypto-org", "kava",
    "secret", "terra", "injective", "sei", "celestia", "dydx",
    "agoric", "regen", "evmos", "stride", "sommelier", "quicksilver"
  ];
  
  if (cosmosChains.some(chain => chainId.includes(chain))) {
    return true;
  }
  
  // All other chains (EVM, etc.) use uncompressed keys
  return false;
}

/**
 * Process a public key for a specific chain
 * 
 * Applies compression if needed based on chain requirements
 * 
 * @param publicKey - The public key (compressed or uncompressed)
 * @param chainId - The target chain
 * @returns Processed public key in the correct format for the chain
 */
export function processPublicKeyForChain(publicKey: string, chainId: string): string {
  // Remove 0x prefix if present
  const cleanKey = publicKey.replace(/^0x/i, '');
  
  // Check if this is a SECP256K1 key (starts with 04, 02, or 03)
  const firstByte = parseInt(cleanKey.substring(0, 2), 16);
  const isSecp256k1 = firstByte === 0x04 || firstByte === 0x02 || firstByte === 0x03;
  
  
  if (!isSecp256k1) {
    // Not a SECP256K1 key (probably ED25519), return as is
    return cleanKey;
  }
  
  // Check if chain needs compressed key
  if (doesChainNeedCompressedKey(chainId)) {
    // Compress if uncompressed
    if (cleanKey.startsWith('04') && cleanKey.length === 130) {
      return compressPublicKey(cleanKey);
    }
  }
  
  return cleanKey;
}