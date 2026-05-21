import type { RecurringRule } from "../../generated/prisma/client";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import type {
  IRecurringRuleRepository,
  RecurringRuleFilter,
  RecurringRuleWithFrequency,
} from "../interfaces/IRecurringRuleRepository";
import type {
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "../interfaces/IBaseRepository";
import { withAbortSignal } from "../../utils/helpers/withAbortSignal";
import { RECURRING_RULE_EXHAUSTED_NEXT_RUN } from "../../utils/helpers/recurringSchedule";

export class RecurringRuleRepository
  extends BaseRepository<RecurringRule>
  implements IRecurringRuleRepository
{
  protected get delegate(): PrismaDelegate {
    return this.prisma.recurringRule as unknown as PrismaDelegate;
  }

  async findByIdForUser(
    id: string,
    userId: string,
    options?: RequestOptions,
  ): Promise<RecurringRuleWithFrequency | null> {
    return withAbortSignal(
      this.prisma.recurringRule.findFirst({
        where: { id, userId, isDeleted: false },
        include: { frequency: true },
      }),
      options?.signal,
    );
  }

  async findByFilter(
    filter: RecurringRuleFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<RecurringRuleWithFrequency>> {
    const limit = Math.min(Math.max(1, pagination.limit), 100);
    const page = Math.max(1, pagination.page);
    const skip = (page - 1) * limit;

    const where = {
      userId: filter.userId,
      isDeleted: false,
      ...(filter.accountId && { accountId: filter.accountId }),
      ...(filter.frequencyId && { frequencyId: filter.frequencyId }),
      ...(filter.direction && { direction: filter.direction }),
    };

    const [data, total] = await withAbortSignal(
      Promise.all([
        this.prisma.recurringRule.findMany({
          where,
          skip,
          take: limit,
          orderBy: { nextRunAt: "asc" },
          include: { frequency: true },
        }),
        this.prisma.recurringRule.count({ where }),
      ]),
      options?.signal,
    );

    return {
      data: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDueRules(
    asOf: Date,
    limit: number,
    options?: RequestOptions,
  ): Promise<RecurringRuleWithFrequency[]> {
    const rows = await withAbortSignal(
      this.prisma.recurringRule.findMany({
        where: {
          isDeleted: false,
          nextRunAt: { lte: asOf, lt: RECURRING_RULE_EXHAUSTED_NEXT_RUN },
        },
        take: limit * 2,
        orderBy: { nextRunAt: "asc" },
        include: { frequency: true },
      }),
      options?.signal,
    );

    const eligible = (rows as RecurringRuleWithFrequency[]).filter((rule) => {
      if (rule.maxOccurrences != null && rule.occurrenceCount >= rule.maxOccurrences) {
        return false;
      }
      if (rule.endsAt != null && rule.nextRunAt > rule.endsAt) {
        return false;
      }
      return true;
    });

    return eligible.slice(0, limit);
  }

  async findIntersectingPeriod(
    userId: string,
    periodStart: Date,
    periodEnd: Date,
    accountId?: string,
    options?: RequestOptions,
  ): Promise<RecurringRuleWithFrequency[]> {
    return withAbortSignal(
      this.prisma.recurringRule.findMany({
        where: {
          userId,
          isDeleted: false,
          ...(accountId && { accountId }),
          OR: [{ endsAt: null }, { endsAt: { gte: periodStart } }],
        },
        include: { frequency: true },
        orderBy: { name: "asc" },
      }),
      options?.signal,
    );
  }

  async updateSchedule(
    id: string,
    data: { nextRunAt: Date; occurrenceCount: number },
    options?: RequestOptions,
  ): Promise<RecurringRule> {
    return withAbortSignal(
      this.prisma.recurringRule.update({
        where: { id },
        data,
      }),
      options?.signal,
    );
  }
}
