const handlers: {
  processor?: (job: { data: unknown; id: string }) => Promise<void>;
  failed?: (job: { data: { jobId: string }; id: string } | undefined, err: Error) => void;
  completed?: (job: { data: { jobId: string }; id: string }) => void;
} = {};

const mockWorker = {
  on: jest.fn((event: string, cb: (...args: never[]) => void) => {
    if (event === "failed") handlers.failed = cb as typeof handlers.failed;
    if (event === "completed") handlers.completed = cb as typeof handlers.completed;
  }),
  close: jest.fn(),
};

const mockLogger = { error: jest.fn(), debug: jest.fn(), info: jest.fn() };

jest.mock("bullmq", () => ({
  Worker: jest.fn(
    (_name: string, processor: (job: { data: unknown; id: string }) => Promise<void>) => {
      handlers.processor = processor;
      return mockWorker;
    },
  ),
}));

jest.mock("../../../src/config/logger", () => ({
  logger: mockLogger,
  createModuleLogger: jest.fn(() => mockLogger),
}));

jest.mock("../../../src/queues/connection", () => ({
  getQueueConnection: jest.fn().mockReturnValue({ url: "redis://localhost:6379" }),
}));

import { logger } from "../../../src/config/logger";
import { createReportWorker } from "../../../src/workers/report.worker";

describe("createReportWorker", () => {
  const processor = { process: jest.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs job processor and event handlers", async () => {
    createReportWorker(processor as never);

    const job = { id: "bull-1", data: { jobId: "job-1" } };
    await handlers.processor?.(job);
    expect(processor.process).toHaveBeenCalledWith(job.data);

    const err = new Error("fail");
    handlers.failed?.(job, err);
    expect(logger.error).toHaveBeenCalled();

    handlers.failed?.(undefined, err);
    handlers.completed?.(job);
    expect(logger.debug).toHaveBeenCalled();
  });
});
