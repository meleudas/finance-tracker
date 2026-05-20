import { z } from "../../openapi/zod";

export const recurringIntervalUnitSchema = z.enum(["DAY", "WEEK", "MONTH", "YEAR"]);

export const CreateRecurringFrequencySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    every: z.number().int().min(1).max(365),
    unit: recurringIntervalUnitSchema,
  })
  .strict();

export type CreateRecurringFrequencyDto = z.infer<typeof CreateRecurringFrequencySchema>;
