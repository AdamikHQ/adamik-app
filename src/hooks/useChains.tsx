import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { getChains } from "~/api/adamik/chains";
import { Chain } from "~/utils/types";
import { getLocalStorageItem } from "~/utils/localStorage";

export const useChains = () => {
  // Initialize with true as default to show testnets by default
  const [showTestnets, setShowTestnets] = useState<boolean>(true);

  useEffect(() => {
    // Use true as the default value
    setShowTestnets(getLocalStorageItem("showTestnets", true));

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "showTestnets" && event.newValue !== null) {
        setShowTestnets(JSON.parse(event.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Always fetch all chains
  const { data: allChains, ...restQueryResult } = useQuery({
    queryFn: async () => {
      const data = await getChains();
      return data || undefined;
    },
    // No dependencies in the queryKey - we always want all chains
    queryKey: ["chains-all"],
  });

  // Filtered data derived from allChains based on showTestnets setting
  const filteredData = useMemo(() => {
    if (!allChains) return undefined;

    if (showTestnets) {
      return allChains;
    }

    const filtered: Record<string, Chain> = {};
    for (const key in allChains) {
      if (!allChains[key].isTestnetFor) {
        filtered[key] = allChains[key];
      }
    }
    return filtered;
  }, [allChains, showTestnets]);

  return {
    ...restQueryResult,
    data: filteredData,
    allChains,
    showTestnets,
    isLoading: restQueryResult.isLoading,
  };
};
