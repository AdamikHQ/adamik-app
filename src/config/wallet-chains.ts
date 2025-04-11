/**
 * Configuration file for wallet chains that will be automatically used
 * when connecting to the wallet without manual selection
 */

import { Chain } from "~/utils/types";

/**
 * Chain configuration objects
 * These chains will be automatically used when the user clicks on "Connect Wallet"
 */
export const walletChains: string[] = [
  "optimism",
  "bitcoin",
  "tron",
  "ton",
  "algorand",
  "cosmoshub",
  // Add more chains as needed
];

/**
 * Default chain to use if none is specified
 */
export const defaultChain = "ethereum";

/**
 * Get chains in order of preference
 * @param availableChains - Record of chain objects from the API
 * @returns Ordered chains for auto-connect
 */
export const getPreferredChains = (
  availableChains: Record<string, Chain> | null
): string[] => {
  if (!availableChains) return [];

  // Filter configured chains that are actually available in the API
  return walletChains.filter((chainId) => availableChains[chainId]);
};
