// src/validators/budget/budget.create.schema.ts
import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { amountSchema, isoDatetimeSchema } from "../common/schemas";

export const CreateBudgetSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    accountId: cuidSchema,
    currencyId: cuidSchema,
    categoryId: cuidSchema.optional(),
    limitAmount: amountSchema,
    periodStart: isoDatetimeSchema,
    periodEnd: isoDatetimeSchema,
  })
  .strict()
  .refine(
    (data) => new Date(data.periodStart) < new Date(data.periodEnd),
    { message: "periodEnd must be strictly after periodStart", path: ["periodEnd"] }
  );

export type CreateBudgetDto = z.infer<typeof CreateBudgetSchema>;