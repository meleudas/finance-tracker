import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { amountSchema, isoDatetimeSchema, optionalNoteSchema } from "../common/schemas";

export const TransferResponseSchema = z
  .object({
    id: cuidSchema,
    fromAccountId: cuidSchema,
    toAccountId: cuidSchema,
    currencyId: cuidSchema,
    amount: amountSchema,
    occurredAt: isoDatetimeSchema,
    note: optionalNoteSchema,
    createdAt: isoDatetimeSchema,
    updatedAt: isoDatetimeSchema,
    deletedAt: isoDatetimeSchema.nullable(),
    isDeleted: z.boolean(),
  })
  .strict();

export type TransferResponseDto = z.infer<typeof TransferResponseSchema>;
