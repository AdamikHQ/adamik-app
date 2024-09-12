import { useQuery } from "@tanstack/react-query";
import { getTransaction } from "~/api/adamik/transaction";

type GetTransactionParams = {
  chainId: string | undefined;
  transactionId: string | undefined;
};

export const useGetTransaction = ({
  chainId,
  transactionId,
}: GetTransactionParams) => {
  return useQuery({
    queryKey: ["transaction", `${chainId}-${transactionId}`],
    queryFn: async () => getTransaction(chainId, transactionId),
  });
};
