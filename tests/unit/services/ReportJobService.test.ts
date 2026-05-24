jest.mock("../../../src/queues/report.queue", () => ({
  getReportQueue: jest.fn(),
}));

import { getReportQueue } from "../../../src/queues/report.queue";
import { ReportJobService } from "../../../src/services/impl/ReportJobService";
import type { IReportJobRepository } from "../../../src/repositories/interfaces/IReportJobRepository";
import type { IFileStorage } from "../../../src/storage/IFileStorage";
import type { ReportJob } from "../../../src/generated/prisma/client";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../src/utils/errors/ClientErrors";
import { ServiceUnavailableError } from "../../../src/utils/errors/serverErrors";

describe("ReportJobService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const jobId = "clm7v9x1k0000qzq8x8x8x8xc";

  let reportJobRepo: jest.Mocked<IReportJobRepository>;
  let fileStorage: jest.Mocked<IFileStorage>;
  let queueAdd: jest.Mock;
  let service: ReportJobService;

  const pendingJob: ReportJob = {
    id: jobId,
    userId,
    status: "PENDING",
    format: "PDF",
    from: new Date("2026-05-01T00:00:00.000Z"),
    to: new Date("2026-05-31T00:00:00.000Z"),
    accountId: null,
    includeRecurring: true,
    resultJson: null,
    storageKey: null,
    errorMessage: null,
    createdAt: new Date(),
    completedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reportJobRepo = {
      create: jest.fn(),
      findByIdForUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    fileStorage = {
      getPresignedDownloadUrl: jest.fn(),
      downloadFile: jest.fn(),
    } as unknown as jest.Mocked<IFileStorage>;

    queueAdd = jest.fn().mockResolvedValue({ id: "bull-1" });
    (getReportQueue as jest.Mock).mockReturnValue({ add: queueAdd });

    service = new ReportJobService(reportJobRepo, fileStorage);
  });

  it("створює job і додає в чергу", async () => {
    reportJobRepo.create.mockResolvedValue(pendingJob);

    const result = await service.createJob(userId, {
      from: new Date("2026-05-01T00:00:00.000Z"),
      to: new Date("2026-05-31T00:00:00.000Z"),
      includeRecurring: true,
      format: "pdf",
    });

    expect(result.status).toBe("PENDING");
    expect(result.format).toBe("PDF");
    expect(queueAdd).toHaveBeenCalled();
  });

  it("видаляє job з БД і кидає 503, якщо черга недоступна", async () => {
    reportJobRepo.create.mockResolvedValue(pendingJob);
    queueAdd.mockRejectedValue(new Error("Redis down"));
    reportJobRepo.delete.mockResolvedValue(undefined);

    await expect(
      service.createJob(userId, {
        from: new Date("2026-05-01T00:00:00.000Z"),
        to: new Date("2026-05-31T00:00:00.000Z"),
        includeRecurring: true,
        format: "json",
      }),
    ).rejects.toThrow(ServiceUnavailableError);

    expect(reportJobRepo.delete).toHaveBeenCalledWith(jobId, undefined);
  });

  it("getJob кидає NotFoundError", async () => {
    reportJobRepo.findByIdForUser.mockResolvedValue(null);

    await expect(service.getJob(userId, jobId)).rejects.toThrow(NotFoundError);
  });

  it("getJob повертає PENDING без downloadUrl", async () => {
    reportJobRepo.findByIdForUser.mockResolvedValue(pendingJob);

    const result = await service.getJob(userId, jobId);

    expect(result.status).toBe("PENDING");
    expect(result).not.toHaveProperty("downloadUrl");
  });

  it("getJob повертає JSON data для COMPLETED JSON job", async () => {
    reportJobRepo.findByIdForUser.mockResolvedValue({
      ...pendingJob,
      status: "COMPLETED",
      format: "JSON",
      resultJson: {
        period: {
          from: "2026-05-01T00:00:00.000Z",
          to: "2026-05-31T00:00:00.000Z",
        },
        filters: { includeRecurring: true },
        currencies: [],
      },
      completedAt: new Date(),
    });

    const result = await service.getJob(userId, jobId);

    expect(result.status).toBe("COMPLETED");
    expect(result.data).toBeDefined();
  });

  it("getJob повертає downloadUrl для COMPLETED PDF job", async () => {
    reportJobRepo.findByIdForUser.mockResolvedValue({
      ...pendingJob,
      status: "COMPLETED",
      format: "PDF",
      storageKey: "reports/job.pdf",
      completedAt: new Date(),
    });
    fileStorage.getPresignedDownloadUrl.mockResolvedValue("https://pdf.example");

    const result = await service.getJob(userId, jobId);

    expect(result.downloadUrl).toBe("https://pdf.example");
  });

  it("downloadPdf повертає buffer для готового PDF", async () => {
    reportJobRepo.findByIdForUser.mockResolvedValue({
      ...pendingJob,
      status: "COMPLETED",
      format: "PDF",
      storageKey: "reports/job.pdf",
      completedAt: new Date(),
    });
    const buffer = Buffer.from("pdf");
    fileStorage.downloadFile.mockResolvedValue(buffer);

    const result = await service.downloadPdf(userId, jobId);

    expect(result).toBe(buffer);
  });

  it("downloadPdf кидає ValidationError для JSON job", async () => {
    reportJobRepo.findByIdForUser.mockResolvedValue({
      ...pendingJob,
      format: "JSON",
      status: "COMPLETED",
      resultJson: {},
    });

    await expect(service.downloadPdf(userId, jobId)).rejects.toThrow(ValidationError);
  });

  it("downloadPdf кидає 409 для PENDING PDF job", async () => {
    reportJobRepo.findByIdForUser.mockResolvedValue({
      ...pendingJob,
      format: "PDF",
      storageKey: null,
    });

    await expect(service.downloadPdf(userId, jobId)).rejects.toThrow(ConflictError);
  });
});
