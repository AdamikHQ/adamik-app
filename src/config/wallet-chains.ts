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

  // Check if we're in a browser environment
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      // Try to get user-defined chains from localStorage
      const clientState = localStorage.getItem("AdamikClientState");
      if (clientState) {
        const parsedState = JSON.parse(clientState);

        // If user has saved custom default chains, use those
        if (
          parsedState.defaultChains &&
          Array.isArray(parsedState.defaultChains)
        ) {
          // Filter to ensure all chains exist in availableChains
          return parsedState.defaultChains.filter(
            (chainId: string) => availableChains[chainId]
          );
        }

        // Filter chains based on testnet setting if it exists
        if (
          typeof parsedState.showTestnets === "boolean" &&
          !parsedState.showTestnets
        ) {
          // Filter out testnet chains
          const filteredChains = Object.values(availableChains)
            .filter((chain) => !chain.isTestnetFor)
            .map((chain) => chain.id);

          // If no user preferences, filter default chains
          return walletChains.filter(
            (chainId) =>
              availableChains[chainId] && filteredChains.includes(chainId)
          );
        }
      }
    } catch (error) {
      console.error("Error parsing client state:", error);
    }
  }

  // Fall back to default behavior
  return walletChains.filter((chainId) => availableChains[chainId]);
};
