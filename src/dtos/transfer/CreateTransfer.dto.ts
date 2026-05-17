import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { amountSchema, isoDatetimeSchema, optionalNoteSchema } from "../common/schemas";

export const CreateTransferSchema = z
  .object({
    fromAccountId: cuidSchema,
    toAccountId: cuidSchema,
    currencyId: cuidSchema,
    amount: amountSchema,
    occurredAt: isoDatetimeSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "From and to accounts must be different",
    path: ["toAccountId"],
  });

export type CreateTransferDto = z.infer<typeof CreateTransferSchema>;
