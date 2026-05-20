import { Decimal } from "@prisma/client/runtime/client";
import type { Budget } from "../../generated/prisma/client";
import type {
  IBaseRepository,
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "./IBaseRepository";

export interface BudgetFilter {
  userId: string;
  accountId?: string;
  categoryId?: string;
  activeNow?: boolean;
  from?: Date;
  to?: Date;
}

export interface IBudgetRepository extends IBaseRepository<Budget> {
  findOverlapping(
    userId: string,
    accountId: string,
    categoryId: string | null,
    periodStart: Date,
    periodEnd: Date,
    excludeId?: string,
    options?: RequestOptions,
  ): Promise<Budget | null>;

  findActiveByDateRange(userId: string, date: Date, options?: RequestOptions): Promise<Budget[]>;

  findIntersectingPeriod(
    userId: string,
    periodStart: Date,
    periodEnd: Date,
    accountId?: string,
    options?: RequestOptions,
  ): Promise<Budget[]>;

  findActiveById(id: string, userId: string, options?: RequestOptions): Promise<Budget | null>;

  updateLimit(id: string, newLimit: Decimal, options?: RequestOptions): Promise<Budget>;

  findByFilter(
    filter: BudgetFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Budget>>;

  findByUserId(userId: string, options?: RequestOptions): Promise<Budget[]>;
}
