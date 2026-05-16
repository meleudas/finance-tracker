import type { Transfer } from "../../generated/prisma/client";
import type { ITransferRepository, TransferFilter } from "../interfaces/ITransferRepository";
import type {
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "../interfaces/IBaseRepository";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import { withAbortSignal } from "../../utils/helpers/WithAbortSignal";

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

    const hasOccurredBounds = filter.from != null || filter.to != null;
    const where = {
      userId: filter.userId,
      isDeleted: false,
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
}
