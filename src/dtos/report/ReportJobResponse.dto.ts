import { z } from "../../openapi/zod";
import { cuidSchema } from "../common/id.dto";
import { isoDatetimeSchema } from "../common/schemas";
import { financialReportSchema } from "./FinancialReport.dto";

export const reportJobStatusSchema = z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]);

export const reportJobResponseSchema = z.object({
  id: cuidSchema,
  status: reportJobStatusSchema,
  format: z.enum(["JSON", "PDF"]),
  from: isoDatetimeSchema,
  to: isoDatetimeSchema,
  accountId: cuidSchema.nullable(),
  includeRecurring: z.boolean(),
  errorMessage: z.string().nullable(),
  createdAt: isoDatetimeSchema,
  completedAt: isoDatetimeSchema.nullable(),
  data: financialReportSchema.optional(),
  downloadUrl: z.url().optional(),
});

export type ReportJobResponseDto = z.infer<typeof reportJobResponseSchema>;
