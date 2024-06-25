import { useQuery } from "@tanstack/react-query";
import { getChains } from "~/api/chains";

export const useChains = () => {
  return useQuery({
    queryKey: ["chains"],
    queryFn: async () => getChains(),
  });
};
