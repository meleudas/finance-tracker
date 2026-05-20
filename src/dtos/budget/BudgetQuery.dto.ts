// src/validators/budget/budget.query.dto.ts
import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.dto";
import { dateRangeQuerySchema } from "../common/filters.dto";
import { cuidSchema } from "../common/id.dto";

export const BudgetQuerySchema = paginationQuerySchema
  .extend({
    accountId: cuidSchema.optional(),
    categoryId: cuidSchema.optional(),
    activeNow: z.coerce.boolean().optional(),
  })
  .extend(dateRangeQuerySchema.shape)  // ✅ Replacement for .merge()
  .strict();

export type BudgetQueryDto = z.infer<typeof BudgetQuerySchema>;