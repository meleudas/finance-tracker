// src/validators/budget/update-budget-limit.schema.ts
import { z } from "zod";
import { amountSchema } from "../common/schemas";

export const UpdateBudgetLimitSchema = z
  .object({
    limitAmount: amountSchema,
  })
  .strict();

export type UpdateBudgetLimitDto = z.infer<typeof UpdateBudgetLimitSchema>;