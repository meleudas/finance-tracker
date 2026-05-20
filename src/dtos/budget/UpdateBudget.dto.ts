import { z } from "zod";
import {
  amountSchema,
  isoDatetimeSchema,
  isNonEmptyPatch,
  nonEmptyPatchRefineConfig,
} from "../common/schemas";

export const UpdateBudgetSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    limitAmount: amountSchema.optional(),
    periodStart: isoDatetimeSchema.optional(),
    periodEnd: isoDatetimeSchema.optional(),
  })
  .strict()
  .refine(isNonEmptyPatch, nonEmptyPatchRefineConfig);

export type UpdateBudgetDto = z.infer<typeof UpdateBudgetSchema>;
