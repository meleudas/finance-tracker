const mockQueue = {
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => mockQueue),
}));

jest.mock("../../../src/queues/connection", () => ({
  getQueueConnection: jest.fn().mockReturnValue({ url: "redis://localhost:6379" }),
}));

import { Queue } from "bullmq";
import { closeReportQueue, getReportQueue } from "../../../src/queues/report.queue";
import { env } from "../../../src/config/env";

describe("report.queue", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await closeReportQueue();
  });

  it("creates singleton queue with job options", () => {
    const q1 = getReportQueue();
    const q2 = getReportQueue();
    expect(q1).toBe(q2);
    expect(Queue).toHaveBeenCalledWith(
      env.REPORT_QUEUE_NAME,
      expect.objectContaining({
        defaultJobOptions: expect.objectContaining({
          attempts: env.REPORT_JOB_ATTEMPTS,
          backoff: expect.objectContaining({ type: "exponential" }),
        }),
      }),
    );
  });

  it("closeReportQueue closes and clears singleton", async () => {
    getReportQueue();
    await closeReportQueue();
    expect(mockQueue.close).toHaveBeenCalled();
    getReportQueue();
    expect(Queue).toHaveBeenCalledTimes(2);
  });

  it("closeReportQueue tolerates repeated close", async () => {
    await closeReportQueue();
    await closeReportQueue();
    expect(mockQueue.close).toHaveBeenCalled();
  });
});
