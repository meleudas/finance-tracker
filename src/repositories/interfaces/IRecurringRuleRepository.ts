import type { RecurringFrequency, RecurringRule } from "../../generated/prisma/client";
import type { TransactionDirection } from "../../generated/prisma/client";
import type {
  IBaseRepository,
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "./IBaseRepository";

export type RecurringRuleWithFrequency = RecurringRule & {
  frequency: RecurringFrequency;
};

export interface RecurringRuleFilter {
  userId: string;
  accountId?: string;
  frequencyId?: string;
  direction?: TransactionDirection;
}

export interface IRecurringRuleRepository extends IBaseRepository<RecurringRule> {
  findByIdForUser(
    id: string,
    userId: string,
    options?: RequestOptions,
  ): Promise<RecurringRuleWithFrequency | null>;

  findByFilter(
    filter: RecurringRuleFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<RecurringRuleWithFrequency>>;

  findDueRules(
    asOf: Date,
    limit: number,
    options?: RequestOptions,
  ): Promise<RecurringRuleWithFrequency[]>;

  findIntersectingPeriod(
    userId: string,
    periodStart: Date,
    periodEnd: Date,
    accountId?: string,
    options?: RequestOptions,
  ): Promise<RecurringRuleWithFrequency[]>;

  updateSchedule(
    id: string,
    data: { nextRunAt: Date; occurrenceCount: number },
    options?: RequestOptions,
  ): Promise<RecurringRule>;
}
