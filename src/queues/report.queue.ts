import { Queue } from "bullmq";
import { env } from "../config/env";
import { getQueueConnection } from "./connection";

export interface ReportJobPayload {
  jobId: string;
  userId: string;
  from: string;
  to: string;
  accountId?: string;
  format: "JSON" | "PDF";
  includeRecurring: boolean;
}

let reportQueue: Queue<ReportJobPayload> | undefined;

export function getReportQueue(): Queue<ReportJobPayload> {
  reportQueue ??= new Queue<ReportJobPayload>(env.REPORT_QUEUE_NAME, {
    connection: getQueueConnection(),
    defaultJobOptions: {
      attempts: env.REPORT_JOB_ATTEMPTS,
      backoff: {
        type: "exponential",
        delay: env.REPORT_JOB_BACKOFF_MS,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });
  return reportQueue;
}

export async function closeReportQueue(): Promise<void> {
  if (reportQueue) {
    await reportQueue.close();
    reportQueue = undefined;
  }
}
