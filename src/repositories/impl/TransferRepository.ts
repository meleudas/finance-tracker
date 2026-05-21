import type { Prisma, Transfer } from "../../generated/prisma/client";
import type {
  ITransferRepository,
  TransferAccountAggregate,
  TransferFilter,
  TransferSummary,
} from "../interfaces/ITransferRepository";
import type {
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "../interfaces/IBaseRepository";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import { withAbortSignal } from "../../utils/helpers/withAbortSignal";
import { decimalToNumber } from "../../utils/helpers/decimalHelpers";

function buildTransferWhere(filter: TransferFilter): Prisma.TransferWhereInput {
  const hasOccurredBounds = filter.from != null || filter.to != null;
  return {
    userId: filter.userId,
    isDeleted: false,
    ...(filter.currencyId && { currencyId: filter.currencyId }),
    ...(filter.accountId && {
      OR: [{ fromAccountId: filter.accountId }, { toAccountId: filter.accountId }],
    }),
    ...(filter.fromAccountId && { fromAccountId: filter.fromAccountId }),
    ...(filter.toAccountId && { toAccountId: filter.toAccountId }),
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

export class TransferRepository extends BaseRepository<Transfer> implements ITransferRepository {
  protected get delegate(): PrismaDelegate {
    return this.prisma.transfer as unknown as PrismaDelegate;
  }

  async findByUserId(
    userId: string,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Transfer>> {
    const limit = Math.min(Math.max(1, pagination.limit), 100);
    const page = Math.max(1, pagination.page);
    const skip = (page - 1) * limit;
    const where = { userId, isDeleted: false };

    const [data, total] = await withAbortSignal(
      Promise.all([
        this.prisma.transfer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { occurredAt: "desc" },
        }),
        this.prisma.transfer.count({ where }),
      ]),
      options?.signal,
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByFilter(
    filter: TransferFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Transfer>> {
    const limit = Math.min(Math.max(1, pagination.limit), 100);
    const page = Math.max(1, pagination.page);
    const skip = (page - 1) * limit;
    const where = buildTransferWhere(filter);

    const [data, total] = await withAbortSignal(
      Promise.all([
        this.prisma.transfer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { occurredAt: "desc" },
        }),
        this.prisma.transfer.count({ where }),
      ]),
      options?.signal,
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByAccountId(accountId: string, options?: RequestOptions): Promise<Transfer[]> {
    return withAbortSignal(
      this.prisma.transfer.findMany({
        where: {
          isDeleted: false,
          OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
        },
        orderBy: { occurredAt: "desc" },
      }),
      options?.signal,
    );
  }

  async aggregateByAccount(
    filter: TransferFilter,
    options?: RequestOptions,
  ): Promise<TransferAccountAggregate[]> {
    const where = buildTransferWhere(filter);

    const [incoming, outgoing] = await withAbortSignal(
      Promise.all([
        this.prisma.transfer.groupBy({
          by: ["toAccountId"],
          where,
          _sum: { amount: true },
        }),
        this.prisma.transfer.groupBy({
          by: ["fromAccountId"],
          where,
          _sum: { amount: true },
        }),
      ]),
      options?.signal,
    );

    const map = new Map<string, TransferAccountAggregate>();

    for (const row of incoming) {
      const existing = map.get(row.toAccountId) ?? {
        accountId: row.toAccountId,
        transfersIn: 0,
        transfersOut: 0,
      };
      existing.transfersIn += decimalToNumber(row._sum.amount);
      map.set(row.toAccountId, existing);
    }

    for (const row of outgoing) {
      const existing = map.get(row.fromAccountId) ?? {
        accountId: row.fromAccountId,
        transfersIn: 0,
        transfersOut: 0,
      };
      existing.transfersOut += decimalToNumber(row._sum.amount);
      map.set(row.fromAccountId, existing);
    }

    return [...map.values()];
  }

  async countAndSum(filter: TransferFilter, options?: RequestOptions): Promise<TransferSummary> {
    const where = buildTransferWhere(filter);

    const result = await withAbortSignal(
      this.prisma.transfer.aggregate({
        where,
        _count: { _all: true },
        _sum: { amount: true },
      }),
      options?.signal,
    );

    return {
      count: result._count._all,
      totalAmount: decimalToNumber(result._sum.amount),
    };
  }
}
