import { ReportJobProcessor } from "../../../src/workers/reportJobProcessor";
import type { ReportJobRepository } from "../../../src/repositories/impl/ReportJobRepository";
import type { ReportService } from "../../../src/services/impl/ReportService";
import { createMockFileStorage } from "../../helpers/testMocks";

jest.mock("../../../src/reports/pdf/FinancialReportPdfBuilder", () => ({
  buildFinancialReportPdf: jest.fn().mockResolvedValue(Buffer.from("%PDF")),
}));

jest.mock("../../../src/config/logger", () => {
  const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
  return {
    logger: mockLogger,
    createModuleLogger: jest.fn(() => mockLogger),
  };
});

import { buildFinancialReportPdf } from "../../../src/reports/pdf/FinancialReportPdfBuilder";

describe("ReportJobProcessor", () => {
  const payload = {
    jobId: "clm7v9x1k0000qzq8x8x8x8xc",
    userId: "clg7v9x1k0000qzq8x8x8x8x8",
    from: "2026-05-01T00:00:00.000Z",
    to: "2026-05-31T00:00:00.000Z",
    includeRecurring: true,
    format: "JSON" as const,
  };

  let reportJobRepo: jest.Mocked<ReportJobRepository>;
  let reportService: jest.Mocked<ReportService>;
  let fileStorage: ReturnType<typeof createMockFileStorage>;
  let processor: ReportJobProcessor;

  const report = {
    period: { from: payload.from, to: payload.to },
    filters: { includeRecurring: true },
    currencies: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reportJobRepo = {
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn(),
      findByIdForUser: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ReportJobRepository>;
    reportService = {
      buildFinancialReport: jest.fn().mockResolvedValue(report),
    } as unknown as jest.Mocked<ReportService>;
    fileStorage = createMockFileStorage();
    processor = new ReportJobProcessor(reportJobRepo, reportService, fileStorage);
  });

  it("completes JSON job", async () => {
    await processor.process(payload);

    expect(reportJobRepo.update).toHaveBeenCalledWith(payload.jobId, { status: "PROCESSING" });
    expect(reportJobRepo.update).toHaveBeenCalledWith(
      payload.jobId,
      expect.objectContaining({ status: "COMPLETED", resultJson: expect.any(Object) }),
    );
    expect(buildFinancialReportPdf).not.toHaveBeenCalled();
  });

  it("completes PDF job and uploads file", async () => {
    await processor.process({ ...payload, format: "PDF" });

    expect(buildFinancialReportPdf).toHaveBeenCalled();
    expect(fileStorage.uploadFile).toHaveBeenCalled();
    expect(reportJobRepo.update).toHaveBeenCalledWith(
      payload.jobId,
      expect.objectContaining({ status: "COMPLETED", storageKey: expect.stringContaining(".pdf") }),
    );
  });

  it("marks job failed and rethrows on error", async () => {
    reportService.buildFinancialReport.mockRejectedValue(new Error("boom"));

    await expect(processor.process(payload)).rejects.toThrow("boom");

    expect(reportJobRepo.update).toHaveBeenCalledWith(
      payload.jobId,
      expect.objectContaining({ status: "FAILED", errorMessage: "boom" }),
    );
  });

  it("uses generic message for non-Error failures", async () => {
    reportService.buildFinancialReport.mockRejectedValue("bad");

    await expect(processor.process(payload)).rejects.toBe("bad");

    expect(reportJobRepo.update).toHaveBeenCalledWith(
      payload.jobId,
      expect.objectContaining({ errorMessage: "Report generation failed" }),
    );
  });
});
