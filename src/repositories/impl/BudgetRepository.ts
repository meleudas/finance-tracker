import type { Budget } from "../../generated/prisma/client";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import type { IBudgetRepository, BudgetUpsertParams } from "../interfaces/IBudgetRepository";
import type { RequestOptions } from "../interfaces/IBaseRepository";
import { withAbortSignal } from "../../utils/helpers/WithAbortSignal";

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

  async findActiveByPeriod(
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

  async upsert(params: BudgetUpsertParams, options?: RequestOptions): Promise<Budget> {
    return withAbortSignal(this.prisma.budget.upsert(params), options?.signal);
  }
}
