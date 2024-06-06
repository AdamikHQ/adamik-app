import { useQuery } from "@tanstack/react-query";
import { getSupportedChainsIds } from "~/api/chains";

export const useGetSupportedChainsIds = () => {
  return useQuery({
    queryKey: ["supportedChains"],
    queryFn: async () => getSupportedChainsIds(),
  });
};
