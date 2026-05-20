import "../config/prismaClient";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { ReportJobRepository } from "../repositories/impl/ReportJobRepository";
import { ReportService } from "../services/impl/ReportService";
import { AccountRepository } from "../repositories/impl/AccountRepository";
import { TransactionRepository } from "../repositories/impl/TransactionRepository";
import { TransferRepository } from "../repositories/impl/TransferRepository";
import { BudgetRepository } from "../repositories/impl/BudgetRepository";
import { CategoryRepository } from "../repositories/impl/CategoryRepository";
import { CurrencyRepository } from "../repositories/impl/CurrencyRepository";
import { RecurringRuleRepository } from "../repositories/impl/RecurringRuleRepository";
import { FileStorage } from "../storage/FileStorage";
import { ReportJobProcessor } from "./reportJobProcessor";
import { createReportWorker } from "./report.worker";
import { closeReportQueue } from "../queues/report.queue";

const reportProcessor = new ReportJobProcessor(
  new ReportJobRepository(),
  new ReportService(
    new AccountRepository(),
    new TransactionRepository(),
    new TransferRepository(),
    new BudgetRepository(),
    new CategoryRepository(),
    new CurrencyRepository(),
    new RecurringRuleRepository(),
  ),
  new FileStorage(),
);

const reportWorker = createReportWorker(reportProcessor);

logger.info(
  {
    queue: env.REPORT_QUEUE_NAME,
    concurrency: env.REPORT_WORKER_CONCURRENCY,
  },
  "Report worker started",
);

async function shutdown(): Promise<void> {
  await reportWorker.close();
  await closeReportQueue();
  logger.info("Report worker stopped");
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
