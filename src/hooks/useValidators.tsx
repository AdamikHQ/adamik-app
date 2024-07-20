import { useQuery } from "@tanstack/react-query";
import { getValidators } from "~/api/adamik/validators";

type GetValidatorParams = {
  chainId: string;
};

export const useValidators = ({ chainId }: GetValidatorParams) => {
  return useQuery({
    queryKey: ["validators", chainId],
    queryFn: async () => getValidators(chainId),
  });
};
