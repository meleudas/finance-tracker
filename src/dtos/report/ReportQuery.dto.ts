import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { requiredCoercedDateSchema } from "../common/query-schemas";
import { dateRangeRefineConfig, hasValidDateRange } from "../common/schemas";

export const reportFiltersSchema = z.object({
  accountId: cuidSchema.optional(),
  includeRecurring: z
    .union([z.enum(["true", "false"]), z.boolean()])
    .optional()
    .default("true")
    .transform((v) => v !== "false" && v !== false),
});

export const reportQuerySchema = z
  .object({
    from: requiredCoercedDateSchema("from"),
    to: requiredCoercedDateSchema("to"),
  })
  .extend(reportFiltersSchema.shape)
  .refine(hasValidDateRange, dateRangeRefineConfig);

export type ReportQueryDto = z.infer<typeof reportQuerySchema>;
