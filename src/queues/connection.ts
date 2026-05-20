import { env } from "../config/env";

export function getQueueConnection(): { url: string } {
  return { url: env.REDIS_URL };
}
