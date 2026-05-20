// src/services/interfaces/IBudgetService.ts
import type { Budget } from "../../generated/prisma/client";
import type { CreateBudgetDto } from "../../dtos/budget/CreateBudget.dto";
import type { UpdateBudgetLimitDto } from "../../dtos/budget/UpdateBudgetLimit.dto";
import type { RequestOptions } from "../../repositories/interfaces/IBaseRepository";
import type { BudgetProgressDto } from "../../dtos/budget/BudgetProgress.dto";

export interface IBudgetService {
  // 🔥 userId передається окремо (з auth-контексту), НЕ з DTO
  createBudget(
    userId: string,
    dto: CreateBudgetDto, 
    options?: RequestOptions
  ): Promise<Budget>;
  
  updateBudgetLimit(
    userId: string,
    budgetId: string,
    dto: UpdateBudgetLimitDto,
    options?: RequestOptions,
  ): Promise<Budget>;
  
  deleteBudget(
    userId: string,
    budgetId: string,
    options?: RequestOptions,
  ): Promise<void>;
  
  getBudgetsProgress(
    userId: string,
    targetDate: Date,
    options?: RequestOptions,
  ): Promise<BudgetProgressDto[]>;
}