// src/repositories/interfaces/IBudgetRepository.ts
import { Decimal } from "@prisma/client/runtime/client";
import type { Budget } from "../../generated/prisma/client";
import type { IBaseRepository, RequestOptions } from "./IBaseRepository";

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

  findActiveById(id: string, userId: string, options?: RequestOptions): Promise<Budget | null>;

  updateLimit(id: string, newLimit: Decimal, options?: RequestOptions): Promise<Budget>;
}
