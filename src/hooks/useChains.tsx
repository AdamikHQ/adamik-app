import { useQuery } from "@tanstack/react-query";
import { getChains } from "~/api/adamik/chains";
import { Chain } from "~/utils/types";
import { useMemo, useState, useEffect } from "react";

export const CHAINS_QUERY_KEY = ["chains"] as const;

export const useChains = () => {
  return useQuery<Record<string, Chain> | null>({
    queryKey: CHAINS_QUERY_KEY,
    queryFn: async () => {
      const chains = await getChains();
      // If chains is null, throw an error to trigger React Query's retry logic
      if (chains === null) {
        throw new Error("Failed to fetch chains data");
      }
      return chains;
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 3,
  });
};

// A hook that filters chains based on the showTestnets setting
export const useFilteredChains = () => {
  const { data: allChains, ...rest } = useChains();
  const [showTestnets, setShowTestnets] = useState(false); // Default to false - hide testnets

  useEffect(() => {
    // Get the showTestnets setting from localStorage
    if (typeof window !== "undefined") {
      try {
        const clientState = localStorage.getItem("AdamikClientState");
        if (clientState) {
          const parsedState = JSON.parse(clientState);
          if (typeof parsedState.showTestnets === "boolean") {
            setShowTestnets(parsedState.showTestnets);
          }
        }
      } catch (error) {
        console.error("Error reading showTestnets setting:", error);
      }
    }
  }, []);

  // Filter chains based on the showTestnets setting
  const filteredData = useMemo(() => {
    if (!allChains) return null;

    if (showTestnets) {
      return allChains; // Return all chains
    } else {
      // Filter out testnets
      const filtered: Record<string, Chain> = {};

      Object.entries(allChains).forEach(([chainId, chain]) => {
        if (!chain.isTestnetFor) {
          filtered[chainId] = chain;
        }
      });

      return filtered;
    }
  }, [allChains, showTestnets]);

  return {
    data: filteredData,
    ...rest,
    // Also expose the setting for components that need it
    showTestnets,
  };
};
