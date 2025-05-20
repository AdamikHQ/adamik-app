import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getChains } from "~/api/adamik/chains";
import { Chain } from "~/utils/types";
import { getLocalStorageItem } from "~/utils/localStorage";

export const useChains = () => {
  const [showTestnets, setShowTestnets] = useState<boolean>(false);

  useEffect(() => {
    setShowTestnets(getLocalStorageItem("showTestnets", false));

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

  return useQuery({
    queryFn: async () => {
      const data = await getChains();
      return data || undefined;
    },
    select: (data: Record<string, Chain> | undefined) => {
      if (!data) return undefined;
      if (showTestnets) {
        return data;
      }
      const filteredData: Record<string, Chain> = {};
      for (const key in data) {
        if (!data[key].isTestnetFor) {
          filteredData[key] = data[key];
        }
      }
      return filteredData;
    },
    queryKey: ["chains", showTestnets],
  });
};
