import { z } from "../../openapi/zod";
import { RecurringFrequencyResponseSchema } from "../recurring-frequency/RecurringFrequencyResponse.dto";
import { transactionDirectionSchema } from "../common/schemas";

export const RecurringRuleResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  accountId: z.string(),
  currencyId: z.string(),
  categoryId: z.string().nullable(),
  frequencyId: z.string(),
  amount: z.number(),
  direction: transactionDirectionSchema,
  nextRunAt: z.string(),
  endsAt: z.string().nullable(),
  maxOccurrences: z.number().int().nullable(),
  occurrenceCount: z.number().int(),
  frequency: RecurringFrequencyResponseSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RecurringRuleResponseDto = z.infer<typeof RecurringRuleResponseSchema>;
