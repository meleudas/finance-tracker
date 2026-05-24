// src/validators/budget/budget.response.schema.ts
import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { amountSchema, isoDatetimeSchema, nonNegativeAmountSchema } from "../common/schemas";

export const BudgetResponseSchema = z
  .object({
    id: cuidSchema,
    name: z.string(),
    accountId: cuidSchema,
    currencyId: cuidSchema,
    categoryId: cuidSchema.nullable(),
    limitAmount: amountSchema,
    periodStart: isoDatetimeSchema,
    periodEnd: isoDatetimeSchema,
    spentAmount: nonNegativeAmountSchema.optional(),
    remainingAmount: nonNegativeAmountSchema.optional(),
    createdAt: isoDatetimeSchema,
    updatedAt: isoDatetimeSchema,
    deletedAt: isoDatetimeSchema.nullable(),
    isDeleted: z.boolean(),
  })
  .strict();

export type BudgetResponseDto = z.infer<typeof BudgetResponseSchema>;
