import { useQuery } from "@tanstack/react-query";
import { getValidators } from "~/api/validator";

type getValidatorParams = {
  chainId: string;
};

export const useValidators = ({ chainId }: getValidatorParams) => {
  return useQuery({
    queryKey: ["validators", chainId],
    queryFn: async () => getValidators(chainId),
  });
};
