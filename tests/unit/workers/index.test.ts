const mockWorkerClose = jest.fn().mockResolvedValue(undefined);

const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

jest.mock("../../../src/config/prismaClient", () => ({}));
jest.mock("../../../src/config/logger", () => ({
  logger: mockLogger,
  createModuleLogger: jest.fn(() => mockLogger),
}));
jest.mock("../../../src/queues/report.queue", () => ({
  closeReportQueue: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../../src/workers/report.worker", () => ({
  createReportWorker: jest.fn().mockReturnValue({ close: mockWorkerClose }),
}));
jest.mock("../../../src/workers/reportJobProcessor", () => ({
  ReportJobProcessor: jest.fn(),
}));
jest.mock("../../../src/repositories/impl/ReportJobRepository", () => ({
  ReportJobRepository: jest.fn(),
}));
jest.mock("../../../src/services/impl/ReportService", () => ({ ReportService: jest.fn() }));
jest.mock("../../../src/repositories/impl/AccountRepository", () => ({
  AccountRepository: jest.fn(),
}));
jest.mock("../../../src/repositories/impl/TransactionRepository", () => ({
  TransactionRepository: jest.fn(),
}));
jest.mock("../../../src/repositories/impl/TransferRepository", () => ({
  TransferRepository: jest.fn(),
}));
jest.mock("../../../src/repositories/impl/BudgetRepository", () => ({
  BudgetRepository: jest.fn(),
}));
jest.mock("../../../src/repositories/impl/CategoryRepository", () => ({
  CategoryRepository: jest.fn(),
}));
jest.mock("../../../src/repositories/impl/CurrencyRepository", () => ({
  CurrencyRepository: jest.fn(),
}));
jest.mock("../../../src/repositories/impl/RecurringRuleRepository", () => ({
  RecurringRuleRepository: jest.fn(),
}));
jest.mock("../../../src/storage/FileStorage", () => ({ FileStorage: jest.fn() }));

import { logger } from "../../../src/config/logger";
import { closeReportQueue } from "../../../src/queues/report.queue";
import { createReportWorker } from "../../../src/workers/report.worker";

describe("workers/index", () => {
  const exitSpy = jest.spyOn(process, "exit").mockImplementation((() => undefined) as never);

  beforeAll(async () => {
    await import("../../../src/workers/index");
  });

  afterAll(() => {
    exitSpy.mockRestore();
  });

  it("starts worker on load", () => {
    expect(createReportWorker).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ queue: expect.any(String) }),
      "Report worker started",
    );
  });

  it("handles SIGINT shutdown", async () => {
    mockWorkerClose.mockClear();
    (closeReportQueue as jest.Mock).mockClear();
    exitSpy.mockClear();

    process.emit("SIGINT");
    await new Promise((r) => setImmediate(r));

    expect(mockWorkerClose).toHaveBeenCalled();
    expect(closeReportQueue).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("handles SIGTERM shutdown", async () => {
    exitSpy.mockClear();
    process.emit("SIGTERM");
    await new Promise((r) => setImmediate(r));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
