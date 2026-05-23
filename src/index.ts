import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import "./config/prismaClient";
import { connectRedis } from "./config/redisClient";
import { getRecurringRuleRunnerService } from "./container";
import { startRecurringScheduler } from "./scheduler/recurringScheduler";

async function main(): Promise<void> {
  await connectRedis();

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "HTTP server listening");
    startRecurringScheduler(getRecurringRuleRunnerService());
  });
}

void main();
