import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import {
  amountSchema,
  isoDatetimeSchema,
  optionalNoteSchema,
  transactionDirectionSchema,
} from "../common/schemas";

export const CreateTransactionSchema = z
  .object({
    accountId: cuidSchema,
    currencyId: cuidSchema,
    categoryId: cuidSchema.optional(),
    amount: amountSchema,
    direction: transactionDirectionSchema,
    occurredAt: isoDatetimeSchema,
    note: optionalNoteSchema,
  })
  .strict();

export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>;
