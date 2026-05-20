import type { Prisma, Transaction, TransactionDirection } from "../../generated/prisma/client";
import type {
  ITransactionRepository,
  TransactionAccountAggregate,
  TransactionCategoryAggregate,
  TransactionFilter,
  TransactionRecurringRuleAggregate,
} from "../interfaces/ITransactionRepository";
import type {
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "../interfaces/IBaseRepository";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import { withAbortSignal } from "../../utils/helpers/withAbortSignal";
import { decimalToNumber } from "../../utils/helpers/decimalHelpers";

function buildTransactionWhere(filter: TransactionFilter): Prisma.TransactionWhereInput {
  const hasOccurredBounds = filter.from != null || filter.to != null;
  return {
    userId: filter.userId,
    isDeleted: false,
    ...(filter.accountId && { accountId: filter.accountId }),
    ...(filter.categoryId && { categoryId: filter.categoryId }),
    ...(filter.currencyId && { currencyId: filter.currencyId }),
    ...(filter.direction && { direction: filter.direction }),
    ...(hasOccurredBounds
      ? {
          occurredAt: {
            ...(filter.from != null ? { gte: filter.from } : {}),
            ...(filter.to != null ? { lte: filter.to } : {}),
          },
        }
      : {}),
  };
}

export class TransactionRepository
  extends BaseRepository<Transaction>
  implements ITransactionRepository
{
  protected get delegate(): PrismaDelegate {
    return this.prisma.transaction as unknown as PrismaDelegate;
  }

  async findByUserId(
    userId: string,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Transaction>> {
    const limit = Math.min(Math.max(1, pagination.limit), 100);
    const page = Math.max(1, pagination.page);
    const skip = (page - 1) * limit;
    const where = { userId, isDeleted: false };

    const [data, total] = await withAbortSignal(
      Promise.all([
        this.prisma.transaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { occurredAt: "desc" },
        }),
        this.prisma.transaction.count({ where }),
      ]),
      options?.signal,
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByFilter(
    filter: TransactionFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Transaction>> {
    const limit = Math.min(Math.max(1, pagination.limit), 100);
    const page = Math.max(1, pagination.page);
    const skip = (page - 1) * limit;
    const where = buildTransactionWhere(filter);

    const [data, total] = await withAbortSignal(
      Promise.all([
        this.prisma.transaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { occurredAt: "desc" },
        }),
        this.prisma.transaction.count({ where }),
      ]),
      options?.signal,
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByAccountId(accountId: string, options?: RequestOptions): Promise<Transaction[]> {
    return withAbortSignal(
      this.prisma.transaction.findMany({
        where: { accountId, isDeleted: false },
        orderBy: { occurredAt: "desc" },
      }),
      options?.signal,
    );
  }

  async findByCategoryId(categoryId: string, options?: RequestOptions): Promise<Transaction[]> {
    return withAbortSignal(
      this.prisma.transaction.findMany({
        where: { categoryId, isDeleted: false },
        orderBy: { occurredAt: "desc" },
      }),
      options?.signal,
    );
  }

  async sumExpenseAmount(filter: TransactionFilter, options?: RequestOptions): Promise<number> {
    return this.sumAmount(filter, "EXPENSE", options);
  }

  async sumAmount(
    filter: TransactionFilter,
    direction: TransactionDirection,
    options?: RequestOptions,
  ): Promise<number> {
    const where = {
      ...buildTransactionWhere(filter),
      direction,
    };

    const result = await withAbortSignal(
      this.prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
      }),
      options?.signal,
    );

    return decimalToNumber(result._sum.amount);
  }

  async sumByCategory(
    filter: TransactionFilter,
    options?: RequestOptions,
  ): Promise<TransactionCategoryAggregate[]> {
    const rows = await withAbortSignal(
      this.prisma.transaction.groupBy({
        by: ["categoryId", "direction"],
        where: buildTransactionWhere(filter),
        _sum: { amount: true },
        _count: { _all: true },
      }),
      options?.signal,
    );

    return rows.map((row) => ({
      categoryId: row.categoryId,
      direction: row.direction,
      amount: decimalToNumber(row._sum.amount),
      transactionCount: row._count._all,
    }));
  }

  async sumByAccount(
    filter: TransactionFilter,
    options?: RequestOptions,
  ): Promise<TransactionAccountAggregate[]> {
    const rows = await withAbortSignal(
      this.prisma.transaction.groupBy({
        by: ["accountId", "direction"],
        where: buildTransactionWhere(filter),
        _sum: { amount: true },
      }),
      options?.signal,
    );

    return rows.map((row) => ({
      accountId: row.accountId,
      direction: row.direction,
      amount: decimalToNumber(row._sum.amount),
    }));
  }

  async sumByRecurringRule(
    filter: TransactionFilter,
    options?: RequestOptions,
  ): Promise<TransactionRecurringRuleAggregate[]> {
    const rows = await withAbortSignal(
      this.prisma.transaction.groupBy({
        by: ["recurringRuleId"],
        where: {
          ...buildTransactionWhere(filter),
          recurringRuleId: { not: null },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      options?.signal,
    );

    return rows
      .filter((row): row is typeof row & { recurringRuleId: string } => row.recurringRuleId != null)
      .map((row) => ({
        recurringRuleId: row.recurringRuleId,
        amount: decimalToNumber(row._sum.amount),
        transactionCount: row._count._all,
      }));
  }
}
