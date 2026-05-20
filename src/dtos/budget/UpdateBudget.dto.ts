// src/validators/budget/budget.update.schema.ts
import { z } from "zod";
import { CreateBudgetSchema } from "./CreateBudget.dto";
import { isNonEmptyPatch, nonEmptyPatchRefineConfig } from "../common/schemas";

export const UpdateBudgetSchema = CreateBudgetSchema
  .omit({ accountId: true, currencyId: true, categoryId: true })
  .partial()
  .strict()
  .refine(isNonEmptyPatch, nonEmptyPatchRefineConfig);

export type UpdateBudgetDto = z.infer<typeof UpdateBudgetSchema>;