import type { Prisma } from "../generated/prisma/client";
import type { ReportJobPayload } from "../queues/report.queue";
import type { ReportJobRepository } from "../repositories/impl/ReportJobRepository";
import type { ReportService } from "../services/impl/ReportService";
import type { IFileStorage } from "../storage/IFileStorage";
import { buildReportStorageKey } from "../storage/reportKey";
import { buildFinancialReportPdf } from "../reports/pdf/FinancialReportPdfBuilder";
import { logger } from "../config/logger";

export class ReportJobProcessor {
  constructor(
    private readonly reportJobRepo: ReportJobRepository,
    private readonly reportService: ReportService,
    private readonly fileStorage: IFileStorage,
  ) {}

  async process(payload: ReportJobPayload): Promise<void> {
    const { jobId, userId } = payload;

    try {
      await this.reportJobRepo.update(jobId, { status: "PROCESSING" });

      const report = await this.reportService.buildFinancialReport(userId, {
        from: new Date(payload.from),
        to: new Date(payload.to),
        accountId: payload.accountId,
        includeRecurring: payload.includeRecurring,
      });

      if (payload.format === "JSON") {
        await this.reportJobRepo.update(jobId, {
          status: "COMPLETED",
          resultJson: JSON.parse(JSON.stringify(report)) as Prisma.InputJsonValue,
          completedAt: new Date(),
        });
        return;
      }

      const pdfBuffer = await buildFinancialReportPdf(report);
      const storageKey = buildReportStorageKey(userId, jobId);
      await this.fileStorage.uploadFile(storageKey, pdfBuffer, "application/pdf");

      await this.reportJobRepo.update(jobId, {
        status: "COMPLETED",
        storageKey,
        resultJson: {
          period: report.period,
          filters: report.filters,
        },
        completedAt: new Date(),
      });

      logger.info({ jobId, userId, storageKey }, "Report PDF job completed");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Report generation failed";
      await this.reportJobRepo.update(jobId, {
        status: "FAILED",
        errorMessage: message,
        completedAt: new Date(),
      });
      throw error;
    }
  }
}
