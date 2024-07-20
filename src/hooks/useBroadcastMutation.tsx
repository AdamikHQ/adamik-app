import { useMutation } from "@tanstack/react-query";
import { broadcast } from "~/api/adamik/broadcast";
import { Transaction } from "~/utils/types";
import { clearAddressStateCache } from "./useAddressState";

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
    onSuccess: (_, variables) => {
      setTimeout(() => {
        const addressParam = {
          chainId: variables.transaction.chainId,
          address: variables.transaction.senders[0],
        };
        clearAddressStateCache(addressParam);
      }, 10000); // Timeout it may seems that broadcast isn't reflected instantly
    },
  });
};
