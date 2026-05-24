import cron, { type ScheduledTask } from "node-cron";
import { createModuleLogger } from "../config/logger";
import { env } from "../config/env";
import type { IRecurringRuleRunnerService } from "../services/interfaces/IRecurringRuleRunnerService";

const logger = createModuleLogger("RecurringScheduler");

let scheduledTask: ScheduledTask | null = null;

export function startRecurringScheduler(runner: IRecurringRuleRunnerService): void {
  if (!env.RECURRING_SCHEDULER_ENABLED) {
    logger.info("Recurring scheduler is disabled");
    return;
  }

  if (!cron.validate(env.RECURRING_SCHEDULER_CRON)) {
    logger.error(
      { cron: env.RECURRING_SCHEDULER_CRON },
      "Invalid RECURRING_SCHEDULER_CRON; scheduler not started",
    );
    return;
  }

  scheduledTask = cron.schedule(env.RECURRING_SCHEDULER_CRON, () => {
    void runner.processDueRules().then((result) => {
      if (result.processed > 0 || result.failed > 0) {
        logger.info(result, "Recurring scheduler tick completed");
      }
    });
  });

  logger.info(
    { cron: env.RECURRING_SCHEDULER_CRON, batchSize: env.RECURRING_SCHEDULER_BATCH_SIZE },
    "Recurring scheduler started",
  );
}

export function stopRecurringScheduler(): void {
  void scheduledTask?.stop();
  scheduledTask = null;
}
