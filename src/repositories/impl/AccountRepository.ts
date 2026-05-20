import type { Account } from "../../generated/prisma/client";
import type { IAccountRepository, AccountFilter } from "../interfaces/IAccountRepository";
import type {
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "../interfaces/IBaseRepository";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import { withAbortSignal } from "../../utils/withAbortSignal";

export class AccountRepository extends BaseRepository<Account> implements IAccountRepository {
  protected get delegate(): PrismaDelegate {
    return this.prisma.account as unknown as PrismaDelegate;
  }

  async create(
    data: Omit<Account, "id" | "createdAt" | "updatedAt" | "isDeleted">,
    options?: RequestOptions,
  ): Promise<Account> {
    return withAbortSignal(this.prisma.account.create({ data }), options?.signal);
  }

  async update(id: string, data: Partial<Account>, options?: RequestOptions): Promise<Account> {
    return withAbortSignal(this.prisma.account.update({ where: { id }, data }), options?.signal);
  }

  async softDelete(id: string, options?: RequestOptions): Promise<Account> {
    return withAbortSignal(
      this.prisma.account.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
      }),
      options?.signal,
    );
  }

  async findById(id: string, options?: RequestOptions): Promise<Account | null> {
    return withAbortSignal(
      this.prisma.account.findUnique({ where: { id, isDeleted: false } }),
      options?.signal,
    );
  }

  async findByUserId(
    userId: string,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Account>> {
    const limit = Math.min(Math.max(1, pagination.limit), 100);
    const page = Math.max(1, pagination.page);
    const skip = (page - 1) * limit;
    const where = { userId, isDeleted: false };

    const [data, total] = await withAbortSignal(
      Promise.all([
        this.prisma.account.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        this.prisma.account.count({ where }),
      ]),
      options?.signal,
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByFilter(
    filter: AccountFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Account>> {
    const limit = Math.min(Math.max(1, pagination.limit), 100);
    const page = Math.max(1, pagination.page);
    const skip = (page - 1) * limit;

    const where = {
      userId: filter.userId,
      isDeleted: filter.isDeleted ?? false,
      ...(filter.currencyId && { currencyId: filter.currencyId }),
    };

    const [data, total] = await withAbortSignal(
      Promise.all([
        this.prisma.account.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        this.prisma.account.count({ where }),
      ]),
      options?.signal,
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
