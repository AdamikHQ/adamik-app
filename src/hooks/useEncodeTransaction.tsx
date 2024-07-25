import { useMutation } from "@tanstack/react-query";
import { transactionEncode } from "~/api/adamik/encode";
import { PlainTransaction } from "~/utils/types";

export const useEncodeTransaction = () => {
  return useMutation({
    mutationFn: (plainTransaction: PlainTransaction) =>
      transactionEncode(plainTransaction),
  });
};
