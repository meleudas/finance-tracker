// src/validators/budget/budget.params.schema.ts
import { z } from "zod";
import { cuidSchema } from "../common/id.dto";

export const BudgetIdParamSchema = z
  .object({ budgetId: cuidSchema })
  .strict();

export type BudgetIdParamDto = z.infer<typeof BudgetIdParamSchema>;