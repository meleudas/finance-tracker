// src/validators/budget/budget.list.response.schema.ts
import { z } from "zod";
import { BudgetResponseSchema } from "./BudgetResponse.dto";
import { paginationQuerySchema } from "../common/pagination.dto";

export const BudgetListResponseSchema = z
  .object({
    data: z.array(BudgetResponseSchema),
    meta: z.object({
      page: paginationQuerySchema.shape.page,
      limit: paginationQuerySchema.shape.limit,
      total: z.number().int().nonnegative(),
      hasNextPage: z.boolean(),
    }),
  })
  .strict();

export type BudgetListResponseDto = z.infer<typeof BudgetListResponseSchema>;