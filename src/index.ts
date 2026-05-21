import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import "./config/prismaClient";
import { getRecurringRuleRunnerService } from "./container";
import { startRecurringScheduler } from "./scheduler/recurringScheduler";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "HTTP server listening");
  startRecurringScheduler(getRecurringRuleRunnerService());
});
