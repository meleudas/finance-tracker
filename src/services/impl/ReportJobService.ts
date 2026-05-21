import type { IReportJobService } from "../interfaces/IReportJobService";
import type { IReportJobRepository } from "../../repositories/interfaces/IReportJobRepository";
import type { CreateReportJobDto } from "../../dtos/report/CreateReportJob.dto";
import type { ReportJobResponseDto } from "../../dtos/report/ReportJobResponse.dto";
import { NotFoundError, ValidationError } from "../../utils/errors/ClientErrors";
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

    if (!job.storageKey) {
      throw new ValidationError("Report PDF is not available");
    }

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
    if (job.status !== "COMPLETED" || job.format !== "PDF" || !job.storageKey) {
      throw new ValidationError("Report PDF is not ready");
    }
    return this.fileStorage.downloadFile(job.storageKey);
  }
}
