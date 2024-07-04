import { useMutation } from "@tanstack/react-query";
import { broadcast } from "~/api/broadcast";
import { Transaction } from "~/utils/types";

export const useBroadcastMutation = () => {
  return useMutation({
    mutationFn: ({
      transaction,
      signature,
      encodedTransaction,
    }: {
      transaction: Transaction;
      signature: string;
      encodedTransaction?: string;
    }) => broadcast({ transaction, signature, encodedTransaction }),
  });
};
