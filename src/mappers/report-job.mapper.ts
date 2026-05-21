import type { ReportJob } from "../generated/prisma/client";
import type { FinancialReportDto } from "../dtos/report/FinancialReport.dto";
import type { ReportJobResponseDto } from "../dtos/report/ReportJobResponse.dto";
import { financialReportSchema } from "../dtos/report/FinancialReport.dto";

export function toReportJobResponse(
  job: ReportJob,
  extras?: { data?: FinancialReportDto; downloadUrl?: string },
): ReportJobResponseDto {
  return {
    id: job.id,
    status: job.status,
    format: job.format,
    from: job.from.toISOString(),
    to: job.to.toISOString(),
    accountId: job.accountId,
    includeRecurring: job.includeRecurring,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    ...(extras?.data && { data: extras.data }),
    ...(extras?.downloadUrl && { downloadUrl: extras.downloadUrl }),
  };
}

export function parseReportJobResultJson(job: ReportJob): FinancialReportDto | undefined {
  if (job.format !== "JSON" || job.resultJson == null) return undefined;
  const parsed = financialReportSchema.safeParse(job.resultJson);
  return parsed.success ? parsed.data : undefined;
}
