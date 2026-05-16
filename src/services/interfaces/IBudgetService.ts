import type { Budget } from "../../generated/prisma/client";
import type { RequestOptions } from "../../repositories/interfaces/IBaseRepository";

export interface CreateBudgetDTO {
  userId: string;
  accountId: string;
  currencyId: string;
  categoryId?: string | null;
  name: string;
  periodStart: Date;
  periodEnd: Date;
  limitAmount: number;
}

export interface UpdateBudgetLimitDTO {
  limitAmount: number;
}

export interface BudgetProgressDTO {
  id: string;
  name: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  isExceeded: boolean;
  periodStart: Date;
  periodEnd: Date;
  accountId: string;
  categoryId: string | null;
  currencyCode: string;
}

export interface IBudgetService {
  createBudget(dto: CreateBudgetDTO, options?: RequestOptions): Promise<Budget>;
  updateBudgetLimit(
    userId: string,
    budgetId: string,
    dto: UpdateBudgetLimitDTO,
    options?: RequestOptions,
  ): Promise<Budget>;
  deleteBudget(userId: string, budgetId: string, options?: RequestOptions): Promise<void>;
  getBudgetsProgress(
    userId: string,
    targetDate: Date,
    options?: RequestOptions,
  ): Promise<BudgetProgressDTO[]>;
}
