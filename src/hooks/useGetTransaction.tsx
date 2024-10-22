import { useQuery } from "@tanstack/react-query";
import { getTransaction } from "~/api/adamik/transaction";

type GetTransactionParams = {
  chainId: string | undefined;
  transactionId: string | undefined;
  fetchTrigger: number;
};

export const useGetTransaction = ({
  chainId,
  transactionId,
  fetchTrigger,
}: GetTransactionParams) => {
  return useQuery({
    // Including fetchTrigger in the queryKey forces a refetch when it changes
    queryKey: ["transaction", chainId, transactionId, fetchTrigger],
    queryFn: async () => getTransaction(chainId, transactionId),
    // Prevent query execution if chainId or transactionId are undefined
    enabled: !!chainId && !!transactionId,
  });
};
