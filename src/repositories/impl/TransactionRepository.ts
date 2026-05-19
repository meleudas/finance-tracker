import type { Transaction } from "../../generated/prisma/client";
import type {
  ITransactionRepository,
  TransactionFilter,
} from "../interfaces/ITransactionRepository";
import type {
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "../interfaces/IBaseRepository";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import { withAbortSignal } from "../../utils/withAbortSignal";

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

    const hasOccurredBounds = filter.from != null || filter.to != null;
    const where = {
      userId: filter.userId,
      isDeleted: false,
      ...(filter.accountId && { accountId: filter.accountId }),
      ...(filter.categoryId && { categoryId: filter.categoryId }),
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
}
