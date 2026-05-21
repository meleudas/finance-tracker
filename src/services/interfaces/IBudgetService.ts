import type { CreateBudgetDto } from "../../dtos/budget/CreateBudget.dto";
import type { UpdateBudgetLimitDto } from "../../dtos/budget/UpdateBudgetLimit.dto";
import type { UpdateBudgetDto } from "../../dtos/budget/UpdateBudget.dto";
import type { BudgetQueryDto } from "../../dtos/budget/BudgetQuery.dto";
import type { BudgetResponseDto } from "../../dtos/budget/BudgetResponse.dto";
import type { DeleteResponseDto } from "../../dtos/common/DeleteResponse.dto";
import type { PaginatedResult } from "../../repositories/interfaces/IBaseRepository";
import type { BudgetProgressDto } from "../../dtos/budget/BudgetProgress.dto";
import type { ServiceContext } from "../serviceContext";

export interface IBudgetService {
  listBudgets(
    userId: string,
    query: BudgetQueryDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<BudgetResponseDto>>;

  getBudgetById(userId: string, budgetId: string, ctx?: ServiceContext): Promise<BudgetResponseDto>;

  createBudget(
    userId: string,
    dto: CreateBudgetDto,
    ctx?: ServiceContext,
  ): Promise<BudgetResponseDto>;

  updateBudget(
    userId: string,
    budgetId: string,
    dto: UpdateBudgetDto,
    ctx?: ServiceContext,
  ): Promise<BudgetResponseDto>;

  updateBudgetLimit(
    userId: string,
    budgetId: string,
    dto: UpdateBudgetLimitDto,
    ctx?: ServiceContext,
  ): Promise<BudgetResponseDto>;

  deleteBudget(userId: string, budgetId: string, ctx?: ServiceContext): Promise<DeleteResponseDto>;

  getBudgetsProgress(
    userId: string,
    targetDate: Date,
    ctx?: ServiceContext,
  ): Promise<BudgetProgressDto[]>;
}
