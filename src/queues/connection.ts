import type { ConnectionOptions } from "bullmq";
import { env } from "../config/env";

export function getQueueConnection(): ConnectionOptions {
  return {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null,
  };
}
