import { z } from "zod";
import { TransactionMode } from "./types";

export const transactionFormSchema = z
  .object({
    mode: z.nativeEnum(TransactionMode),
    chainId: z.string().min(1),
    sender: z.string().min(1),
    recipient: z.string().min(1).optional(),
    validatorAddress: z.string().optional(),
    amount: z.coerce.number().optional(),
    useMaxAmount: z.boolean(),
    tokenId: z.string().optional(),
    assetIndex: z.number().optional(),
    validatorIndex: z.number().optional(),
    stakingPositionIndex: z.number().optional(),
  })
  .superRefine(({ useMaxAmount, mode }) => {
    if ([TransactionMode.DELEGATE].includes(mode)) {
      return z.object({ validatorAddress: z.string().min(1) });
    }
    if (useMaxAmount) return z.object({ amount: z.literal(0) });
  });

export type TransactionFormInput = z.infer<typeof transactionFormSchema>;
