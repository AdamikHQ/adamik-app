import { useMutation } from "@tanstack/react-query";
import { broadcast } from "~/api/adamik/broadcast";
import { Transaction } from "~/utils/types";
import { clearAccountStateCache } from "./useAccountState";

export const useBroadcastTransaction = () => {
  return useMutation({
    mutationFn: (transaction: Transaction) => broadcast(transaction),
    onSuccess: (_, transaction: Transaction) => {
      setTimeout(() => {
        const addressParam = {
          chainId: transaction.data.chainId,
          address: transaction.data.sender,
        };
        clearAccountStateCache(addressParam);
      }, 10000); // Timeout it may seems that broadcast isn't reflected instantly
    },
  });
};
