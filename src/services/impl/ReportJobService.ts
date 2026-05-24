import type { IReportJobService } from "../interfaces/IReportJobService";
import type { IReportJobRepository } from "../../repositories/interfaces/IReportJobRepository";
import type { CreateReportJobDto } from "../../dtos/report/CreateReportJob.dto";
import type { ReportJobResponseDto } from "../../dtos/report/ReportJobResponse.dto";
import { ConflictError, NotFoundError, ValidationError } from "../../utils/errors/ClientErrors";
import type { ReportJob } from "../../generated/prisma/client";
import { ServiceUnavailableError } from "../../utils/errors/serverErrors";
import { parseOrThrow } from "../../utils/helpers/zodParse";
import { createReportJobSchema } from "../../dtos/report/CreateReportJob.dto";
import { getReportQueue } from "../../queues/report.queue";
import { parseReportJobResultJson, toReportJobResponse } from "../../mappers/report-job.mapper";
import type { IFileStorage } from "../../storage/IFileStorage";
import { env } from "../../config/env";
import type { ServiceContext } from "../serviceContext";
import { repoOptions } from "../serviceContext";

function toReportFormat(format: CreateReportJobDto["format"]): "JSON" | "PDF" {
  return format === "pdf" ? "PDF" : "JSON";
}

function assertPdfDownloadReady(
  job: ReportJob,
): asserts job is ReportJob & { status: "COMPLETED"; storageKey: string } {
  if (job.format !== "PDF") {
    throw new ValidationError("Report job is not a PDF export");
  }

  if (job.status === "PENDING" || job.status === "PROCESSING") {
    throw new ConflictError(
      `Report PDF is still processing (status: ${job.status}). Poll GET /reports/jobs/${job.id} until COMPLETED.`,
    );
  }

  if (job.status === "FAILED") {
    throw new ValidationError(job.errorMessage ?? "Report PDF generation failed");
  }

  if (!job.storageKey) {
    throw new ValidationError("Report PDF is not available");
  }
}

export class ReportJobService implements IReportJobService {
  constructor(
    private readonly reportJobRepo: IReportJobRepository,
    private readonly fileStorage: IFileStorage,
  ) {}

  async createJob(
    userId: string,
    dto: CreateReportJobDto,
    ctx?: ServiceContext,
  ): Promise<ReportJobResponseDto> {
    const validated = parseOrThrow(createReportJobSchema, dto);
    const options = repoOptions(ctx);
    const format = toReportFormat(validated.format);

    const job = await this.reportJobRepo.create(
      {
        userId,
        format,
        from: validated.from,
        to: validated.to,
        accountId: validated.accountId,
        includeRecurring: validated.includeRecurring,
      },
      options,
    );

    const queue = getReportQueue();
    try {
      await queue.add(
        "generate",
        {
          jobId: job.id,
          userId,
          from: validated.from.toISOString(),
          to: validated.to.toISOString(),
          accountId: validated.accountId,
          format,
          includeRecurring: validated.includeRecurring,
        },
        { jobId: job.id },
      );
    } catch {
      try {
        await this.reportJobRepo.delete(job.id, options);
      } catch {
        // best-effort cleanup if enqueue failed
      }
      throw new ServiceUnavailableError("Report queue is unavailable");
    }

    return toReportJobResponse(job);
  }

  async getJob(userId: string, jobId: string, ctx?: ServiceContext): Promise<ReportJobResponseDto> {
    const options = repoOptions(ctx);
    const job = await this.reportJobRepo.findByIdForUser(jobId, userId, options);
    if (!job) throw new NotFoundError("Report job");

    if (job.status !== "COMPLETED") {
      return toReportJobResponse(job);
    }

    if (job.format === "JSON") {
      const data = parseReportJobResultJson(job);
      return toReportJobResponse(job, { data });
    }

    assertPdfDownloadReady(job);

    const downloadUrl = await this.fileStorage.getPresignedDownloadUrl(
      job.storageKey,
      env.REPORT_PDF_PRESIGNED_TTL_SECONDS,
    );

    return toReportJobResponse(job, { downloadUrl });
  }

  async downloadPdf(userId: string, jobId: string, ctx?: ServiceContext): Promise<Buffer> {
    const options = repoOptions(ctx);
    const job = await this.reportJobRepo.findByIdForUser(jobId, userId, options);
    if (!job) throw new NotFoundError("Report job");
    assertPdfDownloadReady(job);
    return this.fileStorage.downloadFile(job.storageKey);
  }
}
