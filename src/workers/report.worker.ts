import { Worker } from "bullmq";
import { env } from "../config/env";
import { getQueueConnection } from "../queues/connection";
import type { ReportJobPayload } from "../queues/report.queue";
import type { ReportJobProcessor } from "./reportJobProcessor";
import { logger } from "../config/logger";

export function createReportWorker(processor: ReportJobProcessor): Worker<ReportJobPayload> {
  const worker = new Worker<ReportJobPayload>(
    env.REPORT_QUEUE_NAME,
    async (job) => {
      await processor.process(job.data);
    },
    {
      connection: getQueueConnection(),
      concurrency: env.REPORT_WORKER_CONCURRENCY,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error({ err, jobId: job?.data.jobId, bullJobId: job?.id }, "Report queue job failed");
  });

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.data.jobId, bullJobId: job.id }, "Report queue job completed");
  });

  return worker;
}
