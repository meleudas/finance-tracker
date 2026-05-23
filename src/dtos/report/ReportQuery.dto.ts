import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { requiredCoercedDateSchema } from "../common/query-schemas";
import { dateRangeRefineConfig, hasValidDateRange } from "../common/schemas";

export const reportQuerySchema = z
  .object({
    from: requiredCoercedDateSchema("from"),
    to: requiredCoercedDateSchema("to"),
    accountId: cuidSchema.optional(),
    includeRecurring: z
      .union([z.enum(["true", "false"]), z.boolean()])
      .optional()
      .default("true")
      .transform((v) => v !== "false" && v !== false),
  })
  .refine(hasValidDateRange, dateRangeRefineConfig);

export type ReportQueryDto = z.infer<typeof reportQuerySchema>;
