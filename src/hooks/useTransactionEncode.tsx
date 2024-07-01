import { useMutation } from "@tanstack/react-query";
import { transactionEncode } from "~/api/encode";
import { Transaction } from "~/utils/types";

export const useTransactionEncode = () => {
  return useMutation({
    mutationFn: (transaction: Transaction) => transactionEncode(transaction),
  });
};
