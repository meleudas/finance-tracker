// src/services/impl/BudgetService.ts
import type { Budget, Currency } from "../../generated/prisma/client"; // 🔥 Тільки типи сутностей, БЕЗ Prisma
import type { IBudgetService } from "../interfaces/IBudgetService";
import type { IBudgetRepository } from "../../repositories/interfaces/IBudgetRepository";
import type { IAccountRepository } from "../../repositories/interfaces/IAccountRepository";
import type { ICategoryRepository } from "../../repositories/interfaces/ICategoryRepository";
import type { ITransactionRepository } from "../../repositories/interfaces/ITransactionRepository";
import type { ICurrencyRepository } from "../../repositories/interfaces/ICurrencyRepository";
import type { CreateBudgetDto } from "../../dtos/budget/CreateBudget.dto";
import type { UpdateBudgetLimitDto } from "../../dtos/budget/UpdateBudgetLimit.dto";
import type { RequestOptions } from "../../repositories/interfaces/IBaseRepository";
import { NotFoundError, ValidationError, ConflictError } from "../../utils/errors/СlientErrors";
import type { BudgetProgressDto } from "../../dtos/budget/BudgetProgress.dto";

export class BudgetService implements IBudgetService {
  constructor(
    private readonly budgetRepo: IBudgetRepository,
    private readonly accountRepo: IAccountRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly currencyRepo: ICurrencyRepository,
  ) {}

  async createBudget(
    userId: string,
    dto: CreateBudgetDto, 
    options?: RequestOptions
  ): Promise<Budget> {
    this.#validatePeriods(dto.periodStart, dto.periodEnd);
    this.#validateAmount(dto.limitAmount);

    const account = await this.accountRepo.findByIdWithCurrency(
      dto.accountId, 
      userId, 
      options
    );
    
    if (!account) {
      throw new NotFoundError(`Account '${dto.accountId}' not found or access denied`);
    }

    if (account.currencyId !== dto.currencyId) {
      throw new ValidationError("Budget currency must match the account currency");
    }

    if (dto.categoryId) {
      const category = await this.categoryRepo.findById(dto.categoryId, options);
      
      if (!category || category.isDeleted || category.userId !== userId) {
        throw new NotFoundError("Category");
      }
      
      if (category.kind !== "EXPENSE") {
        throw new ValidationError("Budgets can only be set for expense categories");
      }
    }

    const hasOverlap = await this.budgetRepo.findOverlapping(
      userId,
      dto.accountId,
      dto.categoryId ?? null,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
      undefined,
      options
    );

    if (hasOverlap) {
      throw new ConflictError("An active budget already overlaps with this period");
    }

    // 🔥 FIX: Створюємо об'єкт даних окремо і приводимо тип до Record<string, unknown>
    // Це дозволяє передати number, покладаючись на репозиторій у конвертації в Decimal
    const createData: Record<string, unknown> = {
      userId,
      accountId: dto.accountId,
      currencyId: dto.currencyId,
      categoryId: dto.categoryId ?? null,
      name: dto.name.trim(),
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      limitAmount: dto.limitAmount, // Передаємо number, репозиторій сконвертує
    };

    return this.budgetRepo.create(createData, options);
  }

  async updateBudgetLimit(
    userId: string,
    budgetId: string,
    dto: UpdateBudgetLimitDto,
    options?: RequestOptions,
  ): Promise<Budget> {
    this.#validateAmount(dto.limitAmount);

    const budget = await this.budgetRepo.findActiveById(budgetId, userId, options);
    
    if (!budget) {
      throw new NotFoundError("Budget not found");
    }

    // 🔥 FIX: Аналогічно для оновлення - передаємо number через Record<string, unknown>
    const updateData: Record<string, unknown> = {
      limitAmount: dto.limitAmount,
    };

    // Якщо updateLimit приймає Record<string, unknown>:
    return this.budgetRepo.update(budgetId, updateData, options);
    
    // АБО, якщо у вас є спеціальний метод updateLimit(id, amount, options):
    // return this.budgetRepo.updateLimit(budgetId, dto.limitAmount, options);
    // (Тоді переконайтеся, що в інтерфейсі він приймає number, а не Decimal)
  }

  async deleteBudget(
    userId: string,
    budgetId: string,
    options?: RequestOptions,
  ): Promise<void> {
    const budget = await this.budgetRepo.findActiveById(budgetId, userId, options);
    
    if (!budget) {
      throw new NotFoundError("Budget not found");
    }

    await this.budgetRepo.softDelete(budgetId, options);
  }

  async getBudgetsProgress(
    userId: string,
    targetDate: Date,
    options?: RequestOptions,
  ): Promise<BudgetProgressDto[]> {
    const queryDate = new Date(targetDate);

    const activeBudgets = await this.budgetRepo.findActiveByDateRange(userId, queryDate, options);

    const progressPromises = activeBudgets.map(async (budget) => {
      const spentAmount = await this.#calculateSpentAmount(
        userId,
        budget.accountId,
        budget.categoryId,
        budget.periodStart,
        budget.periodEnd,
        options
      );

      const limitAmount = this.#toNumber(budget.limitAmount);
      const remainingAmount = Math.max(0, limitAmount - spentAmount);

      const currency = await this.currencyRepo.findById(budget.currencyId, options);
      const currencyCode = currency?.code ?? "UAH";

      return {
        id: budget.id,
        name: budget.name,
        limitAmount,
        spentAmount,
        remainingAmount,
        isExceeded: spentAmount > limitAmount,
        periodStart: budget.periodStart.toISOString(),
        periodEnd: budget.periodEnd.toISOString(),
        accountId: budget.accountId,
        categoryId: budget.categoryId,
        currencyCode,
      };
    });

    return Promise.all(progressPromises);
  }

  async #calculateSpentAmount(
    userId: string,
    accountId: string,
    categoryId: string | null,
    periodStart: Date,
    periodEnd: Date,
    options?: RequestOptions,
  ): Promise<number> {
    const filter = {
      userId,
      accountId,
      direction: "EXPENSE" as const,
      from: periodStart,
      to: periodEnd,
      ...(categoryId && { categoryId }),
    };

    const LARGE_LIMIT = 10000;
    
    const result = await this.transactionRepo.findByFilter(
      filter,
      { page: 1, limit: LARGE_LIMIT },
      options
    );

    const total = result.data.reduce((sum, tx) => 
      sum + this.#toNumber(tx.amount), 0);

    return total;
  }

  #toNumber(value: unknown): number {
    if (value == null) return 0;
    if (typeof value === "number") return value;
    
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    // Split type checks to satisfy ESLint no-unnecessary-condition
    if (typeof value !== "object" || value === null) return 0;
    
    // Use type assertion with property check in separate step
    const obj = value as Record<string, unknown>;
    if (typeof obj.toNumber === "function") {
      return (obj.toNumber as () => number)();
    }
    
    return 0;
  }
  
  #validatePeriods(start: string | Date, end: string | Date): void {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s >= e) {
      throw new ValidationError("periodEnd must be strictly after periodStart");
    }
  }

  #validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new ValidationError("Limit amount must be greater than zero");
    }
  }
}