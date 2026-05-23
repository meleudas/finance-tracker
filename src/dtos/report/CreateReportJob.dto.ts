import { z } from "../../openapi/zod";
import { requiredDateInputSchema } from "../common/query-schemas";
import { dateRangeRefineConfig, hasValidDateRange } from "../common/schemas";
import { reportFiltersSchema } from "./ReportQuery.dto";

export const reportFormatSchema = z.enum(["json", "pdf"]);

export const createReportJobSchema = z
  .object({
    from: requiredDateInputSchema("from"),
    to: requiredDateInputSchema("to"),
  })
  .extend(reportFiltersSchema.shape)
  .extend({
    format: reportFormatSchema,
  })
  .strict()
  .refine(hasValidDateRange, dateRangeRefineConfig);

export type CreateReportJobDto = z.infer<typeof createReportJobSchema>;
