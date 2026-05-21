import { z } from "../../openapi/zod";
import { reportQuerySchema } from "./ReportQuery.dto";

export const reportFormatSchema = z.enum(["json", "pdf"]);

export const createReportJobSchema = reportQuerySchema
  .extend({
    format: reportFormatSchema,
  })
  .strict();

export type CreateReportJobDto = z.infer<typeof createReportJobSchema>;
