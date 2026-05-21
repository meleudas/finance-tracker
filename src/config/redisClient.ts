import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const isTest = env.NODE_ENV === "test";
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: isTest ? 0 : 3,
    lazyConnect: true,
    enableOfflineQueue: !isTest,
    retryStrategy: isTest ? () => null : undefined,
  });

  client.on("connect", () => {
    logger.info("Redis connected");
  });

  client.on("error", (error) => {
    logger.error({ err: error }, "Redis connection error");
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function connectRedis(): Promise<void> {
  if (redis.status === "ready" || redis.status === "connecting") {
    return;
  }
  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (redis.status === "end" || redis.status === "wait") {
    return;
  }
  await redis.quit();
}
