import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { amountSchema, isoDatetimeSchema, nonNegativeAmountSchema } from "../common/schemas";

export const BudgetProgressResponseSchema = z
  .object({
    id: cuidSchema,
    name: z.string(),
    limitAmount: amountSchema,
    spentAmount: nonNegativeAmountSchema,
    remainingAmount: nonNegativeAmountSchema,
    isExceeded: z.boolean(),
    periodStart: isoDatetimeSchema,
    periodEnd: isoDatetimeSchema,
    accountId: cuidSchema,
    categoryId: cuidSchema.nullable(),
    currencyCode: z.string().length(3),
  })
  .strict();

export type BudgetProgressDto = z.infer<typeof BudgetProgressResponseSchema>;
