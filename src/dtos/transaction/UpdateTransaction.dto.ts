import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import {
  amountSchema,
  isoDatetimeSchema,
  isNonEmptyPatch,
  nonEmptyPatchRefineConfig,
  nullableNoteSchema,
  transactionDirectionSchema,
} from "../common/schemas";

export const UpdateTransactionSchema = z
  .object({
    accountId: cuidSchema.optional(),
    currencyId: cuidSchema.optional(),
    categoryId: cuidSchema.nullable().optional(),
    amount: amountSchema.optional(),
    direction: transactionDirectionSchema.optional(),
    occurredAt: isoDatetimeSchema.optional(),
    note: nullableNoteSchema,
  })
  .strict()
  .refine(isNonEmptyPatch, nonEmptyPatchRefineConfig);

export type UpdateTransactionDto = z.infer<typeof UpdateTransactionSchema>;
