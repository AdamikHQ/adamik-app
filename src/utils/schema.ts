import { z } from "zod";
import { TransactionMode } from "./types";

export const transactionFormSchema = z
  .object({
    mode: z.enum([
      TransactionMode.TRANSFER,
      TransactionMode.TRANSFER_TOKEN,
      TransactionMode.DELEGATE,
    ]),
    chainId: z.string().min(1),
    senders: z.string().min(1),
    recipients: z.string().min(1).optional(),
    validatorAddress: z.string().min(1).optional(),
    amount: z.coerce.number().min(0),
    useMaxAmount: z.boolean(),
    tokenId: z.string().optional(),
    assetIndex: z.number().optional(),
    validatorIndex: z.number().optional(),
  })
  .superRefine(({ useMaxAmount }) => {
    if (useMaxAmount) return z.object({ amount: z.literal(0) });
  });

export type TransactionFormInput = z.infer<typeof transactionFormSchema>;
