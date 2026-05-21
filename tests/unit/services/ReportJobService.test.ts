jest.mock("../../../src/queues/report.queue", () => ({
  getReportQueue: jest.fn(),
}));

import { getReportQueue } from "../../../src/queues/report.queue";
import { ReportJobService } from "../../../src/services/impl/ReportJobService";
import type { IReportJobRepository } from "../../../src/repositories/interfaces/IReportJobRepository";
import type { IFileStorage } from "../../../src/storage/IFileStorage";
import type { ReportJob } from "../../../src/generated/prisma/client";

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
});
