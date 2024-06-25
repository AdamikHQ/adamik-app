import { useQuery } from "@tanstack/react-query";
import { getMobulaBlockchains } from "~/api/mobula/blockchains";

export const useMobulaBlockchains = () => {
  return useQuery({
    queryKey: ["mobula-blockchains"],
    queryFn: async () => getMobulaBlockchains(),
  });
};
