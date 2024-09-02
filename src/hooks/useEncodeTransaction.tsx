import { useMutation } from "@tanstack/react-query";
import { transactionEncode } from "~/api/adamik/encode";
import { TransactionData } from "~/utils/types";

export const useEncodeTransaction = () => {
  return useMutation({
    mutationFn: (transactionData: TransactionData) =>
      transactionEncode(transactionData),
  });
};
