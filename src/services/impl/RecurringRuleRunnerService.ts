import { prisma } from "../../config/prismaClient";
import { createModuleLogger } from "../../config/logger";
import { env } from "../../config/env";
import type {
  IRecurringRuleRunnerService,
  RecurringRuleRunResult,
} from "../interfaces/IRecurringRuleRunnerService";
import type { IRecurringRuleRepository } from "../../repositories/interfaces/IRecurringRuleRepository";
import type { IAccountRepository } from "../../repositories/interfaces/IAccountRepository";
import type { ICache } from "../../redis";
import type { RecurringRuleWithFrequency } from "../../repositories/interfaces/IRecurringRuleRepository";
import {
  advanceNextRunAt,
  isRuleExhausted,
  RECURRING_CATCH_UP_MAX_PER_TICK,
  RECURRING_RULE_EXHAUSTED_NEXT_RUN,
} from "../../utils/helpers/recurringSchedule";
import { invalidateUserTransactionAndBudgetCache } from "./userFinanceCacheInvalidation";

const logger = createModuleLogger("RecurringRuleRunner");

export class RecurringRuleRunnerService implements IRecurringRuleRunnerService {
  constructor(
    private readonly ruleRepo: IRecurringRuleRepository,
    private readonly accountRepo: IAccountRepository,
    private readonly cache: ICache,
  ) {}

  async processDueRules(): Promise<RecurringRuleRunResult> {
    const now = new Date();
    const rules = await this.ruleRepo.findDueRules(now, env.RECURRING_SCHEDULER_BATCH_SIZE);

    let processed = 0;
    let created = 0;
    let failed = 0;

    for (const rule of rules) {
      try {
        const count = await this.processRule(rule, now);
        processed += 1;
        created += count;
      } catch (error: unknown) {
        failed += 1;
        logger.error(
          { err: error, ruleId: rule.id, userId: rule.userId },
          "Recurring rule execution failed",
        );
      }
    }

    return { processed, created, failed };
  }

  private async processRule(rule: RecurringRuleWithFrequency, asOf: Date): Promise<number> {
    const account = await this.accountRepo.findByIdWithCurrency(rule.accountId, rule.userId);
    if (!account || account.isDeleted) {
      logger.warn({ ruleId: rule.id }, "Skipping recurring rule: account missing or deleted");
      await this.ruleRepo.updateSchedule(rule.id, {
        nextRunAt: RECURRING_RULE_EXHAUSTED_NEXT_RUN,
        occurrenceCount: rule.occurrenceCount,
      });
      return 0;
    }

    let created = 0;
    let current = rule;
    let iterations = 0;

    while (
      current.nextRunAt <= asOf &&
      current.nextRunAt < RECURRING_RULE_EXHAUSTED_NEXT_RUN &&
      iterations < RECURRING_CATCH_UP_MAX_PER_TICK
    ) {
      if (current.maxOccurrences != null && current.occurrenceCount >= current.maxOccurrences) {
        break;
      }
      if (current.endsAt != null && current.nextRunAt > current.endsAt) {
        break;
      }

      const occurredAt = current.nextRunAt;
      const nextOccurrenceCount = current.occurrenceCount + 1;
      const advancedNext = advanceNextRunAt(
        current.nextRunAt,
        current.frequency.every,
        current.frequency.unit,
      );

      const exhausted = isRuleExhausted(
        {
          occurrenceCount: nextOccurrenceCount,
          maxOccurrences: current.maxOccurrences,
          endsAt: current.endsAt,
          nextRunAt: current.nextRunAt,
        },
        advancedNext,
      );

      const nextRunAt = exhausted ? RECURRING_RULE_EXHAUSTED_NEXT_RUN : advancedNext;

      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: current.userId,
            accountId: current.accountId,
            currencyId: current.currencyId,
            categoryId: current.categoryId,
            recurringRuleId: current.id,
            amount: current.amount,
            direction: current.direction,
            occurredAt,
            note: `Recurring: ${current.name}`,
          },
        }),
        prisma.recurringRule.update({
          where: { id: current.id },
          data: {
            nextRunAt,
            occurrenceCount: nextOccurrenceCount,
          },
        }),
      ]);

      created += 1;
      iterations += 1;

      logger.info(
        {
          ruleId: current.id,
          userId: current.userId,
          occurredAt: occurredAt.toISOString(),
          nextRunAt: nextRunAt.toISOString(),
          occurrenceCount: nextOccurrenceCount,
        },
        "Recurring rule materialized transaction",
      );

      await invalidateUserTransactionAndBudgetCache(this.cache, current.userId);

      if (exhausted) break;

      current = {
        ...current,
        nextRunAt,
        occurrenceCount: nextOccurrenceCount,
      };
    }

    return created;
  }
}
