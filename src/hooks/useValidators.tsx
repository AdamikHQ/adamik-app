import { useQuery } from "@tanstack/react-query";
import { getValidators } from "~/api/validator";

type GetAddressStateParams = {
  chainId: string;
};

export const useValidators = ({ chainId }: GetAddressStateParams) => {
  return useQuery({
    queryKey: ["validators", chainId],
    queryFn: async () => getValidators(chainId),
  });
};
