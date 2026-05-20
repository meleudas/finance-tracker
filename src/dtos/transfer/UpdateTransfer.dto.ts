import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import {
  amountSchema,
  isoDatetimeSchema,
  isNonEmptyPatch,
  nonEmptyPatchRefineConfig,
  nullableNoteSchema,
} from "../common/schemas";

export const UpdateTransferSchema = z
  .object({
    fromAccountId: cuidSchema.optional(),
    toAccountId: cuidSchema.optional(),
    currencyId: cuidSchema.optional(),
    amount: amountSchema.optional(),
    occurredAt: isoDatetimeSchema.optional(),
    note: nullableNoteSchema,
  })
  .strict()
  .refine(isNonEmptyPatch, nonEmptyPatchRefineConfig)
  .refine(
    (data) => {
      if (data.fromAccountId === undefined || data.toAccountId === undefined) {
        return true;
      }
      return data.fromAccountId !== data.toAccountId;
    },
    {
      message: "From and to accounts must be different",
      path: ["toAccountId"],
    },
  );

export type UpdateTransferDto = z.infer<typeof UpdateTransferSchema>;
