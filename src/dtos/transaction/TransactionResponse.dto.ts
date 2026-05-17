import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import {
  amountSchema,
  isoDatetimeSchema,
  optionalNoteSchema,
  transactionDirectionSchema,
} from "../common/schemas";

export const TransactionResponseSchema = z
  .object({
    id: cuidSchema,
    accountId: cuidSchema,
    currencyId: cuidSchema,
    categoryId: cuidSchema.nullable().optional(),
    amount: amountSchema,
    direction: transactionDirectionSchema,
    occurredAt: isoDatetimeSchema,
    note: optionalNoteSchema,
    createdAt: isoDatetimeSchema,
    updatedAt: isoDatetimeSchema,
    deletedAt: isoDatetimeSchema.nullable(),
    isDeleted: z.boolean(),
  })
  .strict();

export type TransactionResponseDto = z.infer<typeof TransactionResponseSchema>;
