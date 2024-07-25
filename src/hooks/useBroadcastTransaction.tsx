import { useMutation } from "@tanstack/react-query";
import { broadcast } from "~/api/adamik/broadcast";
import { Transaction } from "~/utils/types";
import { clearAddressStateCache } from "./useAddressState";

export const useBroadcastTransaction = () => {
  return useMutation({
    mutationFn: (transaction: Transaction) => broadcast(transaction),
    onSuccess: (_, transaction: Transaction) => {
      setTimeout(() => {
        const addressParam = {
          chainId: transaction.plain.chainId,
          address: transaction.plain.senders[0],
        };
        clearAddressStateCache(addressParam);
      }, 10000); // Timeout it may seems that broadcast isn't reflected instantly
    },
  });
};
