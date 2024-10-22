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
    queryKey: ["transaction", chainId, transactionId, fetchTrigger],
    queryFn: async () => getTransaction(chainId, transactionId),
    enabled: !!chainId && !!transactionId,
  });
};
