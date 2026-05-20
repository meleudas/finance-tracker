import { Decimal } from "@prisma/client/runtime/client";
import type { Budget } from "../../generated/prisma/client";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import type { IBudgetRepository, BudgetFilter } from "../interfaces/IBudgetRepository";
import type {
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "../interfaces/IBaseRepository";
import { withAbortSignal } from "../../utils/helpers/withAbortSignal";

export class BudgetRepository extends BaseRepository<Budget> implements IBudgetRepository {
  protected get delegate(): PrismaDelegate {
    return this.prisma.budget as unknown as PrismaDelegate;
  }

  async findByUserId(userId: string, options?: RequestOptions): Promise<Budget[]> {
    return withAbortSignal(
      this.prisma.budget.findMany({
        where: { userId, isDeleted: false },
        include: {
          category: true,
          currency: true,
        },
      }),
      options?.signal,
    );
  }

  async findOverlapping(
    userId: string,
    accountId: string,
    categoryId: string | null,
    periodStart: Date,
    periodEnd: Date,
    excludeId?: string,
    options?: RequestOptions,
  ): Promise<Budget | null> {
    return withAbortSignal(
      this.prisma.budget.findFirst({
        where: {
          userId,
          accountId,
          categoryId,
          isDeleted: false,
          periodStart: { lt: periodEnd },
          periodEnd: { gt: periodStart },
          ...(excludeId && { id: { not: excludeId } }),
        },
      }),
      options?.signal,
    );
  }

  async findActiveByDateRange(
    userId: string,
    date: Date,
    options?: RequestOptions,
  ): Promise<Budget[]> {
    return withAbortSignal(
      this.prisma.budget.findMany({
        where: {
          userId,
          isDeleted: false,
          periodStart: { lte: date },
          periodEnd: { gte: date },
        },
      }),
      options?.signal,
    );
  }

  async findIntersectingPeriod(
    userId: string,
    periodStart: Date,
    periodEnd: Date,
    accountId?: string,
    options?: RequestOptions,
  ): Promise<Budget[]> {
    return withAbortSignal(
      this.prisma.budget.findMany({
        where: {
          userId,
          isDeleted: false,
          periodStart: { lte: periodEnd },
          periodEnd: { gte: periodStart },
          ...(accountId && { accountId }),
        },
      }),
      options?.signal,
    );
  }

  async findActiveById(
    id: string,
    userId: string,
    options?: RequestOptions,
  ): Promise<Budget | null> {
    return withAbortSignal(
      this.prisma.budget.findFirst({
        where: { id, userId, isDeleted: false },
      }),
      options?.signal,
    );
  }

  async updateLimit(id: string, newLimit: Decimal, options?: RequestOptions): Promise<Budget> {
    return withAbortSignal(
      this.prisma.budget.update({
        where: { id },
        data: { limitAmount: newLimit },
      }),
      options?.signal,
    );
  }

  async findByFilter(
    filter: BudgetFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Budget>> {
    const limit = Math.min(Math.max(1, pagination.limit), 100);
    const page = Math.max(1, pagination.page);
    const skip = (page - 1) * limit;

    const now = new Date();
    const hasPeriodBounds = filter.from != null || filter.to != null;

    const where = {
      userId: filter.userId,
      isDeleted: false,
      ...(filter.accountId && { accountId: filter.accountId }),
      ...(filter.categoryId && { categoryId: filter.categoryId }),
      ...(filter.activeNow && {
        periodStart: { lte: now },
        periodEnd: { gte: now },
      }),
      ...(hasPeriodBounds && {
        ...(filter.from != null && { periodEnd: { gte: filter.from } }),
        ...(filter.to != null && { periodStart: { lte: filter.to } }),
      }),
    };

    const [data, total] = await withAbortSignal(
      Promise.all([
        this.prisma.budget.findMany({
          where,
          skip,
          take: limit,
          orderBy: { periodStart: "desc" },
        }),
        this.prisma.budget.count({ where }),
      ]),
      options?.signal,
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
