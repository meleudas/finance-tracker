import { z } from "../../openapi/zod";
import { cuidSchema } from "../common/id.dto";
import { amountSchema, isoDatetimeSchema, transactionDirectionSchema } from "../common/schemas";

export const recurringRuleBaseSchema = z.object({
  name: z.string().trim().min(1).max(200),
  accountId: cuidSchema,
  currencyId: cuidSchema,
  categoryId: cuidSchema.optional(),
  frequencyId: cuidSchema,
  amount: amountSchema,
  direction: transactionDirectionSchema,
  nextRunAt: isoDatetimeSchema.optional(),
  endsAt: isoDatetimeSchema.optional(),
  maxOccurrences: z.number().int().min(1).optional(),
});

export const CreateRecurringRuleSchema = recurringRuleBaseSchema.strict().refine(
  (data) => {
    if (!data.nextRunAt || !data.endsAt) return true;
    return new Date(data.nextRunAt) < new Date(data.endsAt);
  },
  { message: "endsAt must be after nextRunAt", path: ["endsAt"] },
);

export type CreateRecurringRuleDto = z.infer<typeof CreateRecurringRuleSchema>;
