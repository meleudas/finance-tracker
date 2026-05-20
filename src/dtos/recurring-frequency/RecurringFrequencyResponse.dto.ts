import { z } from "../../openapi/zod";
import { recurringIntervalUnitSchema } from "./CreateRecurringFrequency.dto";

export const RecurringFrequencyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  every: z.number().int(),
  unit: recurringIntervalUnitSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RecurringFrequencyResponseDto = z.infer<typeof RecurringFrequencyResponseSchema>;
