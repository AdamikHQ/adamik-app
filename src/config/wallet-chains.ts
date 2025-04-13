/**
 * Configuration file for wallet chains that will be automatically used
 * when connecting to the wallet without manual selection
 */

import { Chain } from "~/utils/types";

/**
 * Chain configuration objects
 * These chains will be automatically used when the user connects a wallet for the first time
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

  // Variable to track if we should hide testnets (default is true - hide testnets)
  let shouldHideTestnets = true;

  // Check if we're in a browser environment
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      // Try to get user settings from localStorage
      const clientState = localStorage.getItem("AdamikClientState");
      if (clientState) {
        const parsedState = JSON.parse(clientState);

        // Override default with user setting if it exists
        if (typeof parsedState.showTestnets === "boolean") {
          shouldHideTestnets = !parsedState.showTestnets;
        }
      }
    } catch (error) {
      console.error("Error parsing client state:", error);
    }
  }

  // Filter chains based on testnet setting
  if (shouldHideTestnets) {
    // Filter out testnet chains
    const filteredChains = Object.values(availableChains)
      .filter((chain) => !chain.isTestnetFor)
      .map((chain) => chain.id);

    // Filter default chains based on testnet setting
    return walletChains.filter(
      (chainId) => availableChains[chainId] && filteredChains.includes(chainId)
    );
  }

  // Return all available chains from the predefined list if showing testnets
  return walletChains.filter((chainId) => availableChains[chainId]);
};
