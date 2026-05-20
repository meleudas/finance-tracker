import type { IBudgetService } from "../interfaces/IBudgetService";
import type { IBudgetRepository } from "../../repositories/interfaces/IBudgetRepository";
import type { IAccountRepository } from "../../repositories/interfaces/IAccountRepository";
import type { ICategoryRepository } from "../../repositories/interfaces/ICategoryRepository";
import type { ITransactionRepository } from "../../repositories/interfaces/ITransactionRepository";
import type { ICurrencyRepository } from "../../repositories/interfaces/ICurrencyRepository";
import type { CreateBudgetDto } from "../../dtos/budget/CreateBudget.dto";
import type { UpdateBudgetLimitDto } from "../../dtos/budget/UpdateBudgetLimit.dto";
import type { UpdateBudgetDto } from "../../dtos/budget/UpdateBudget.dto";
import type { BudgetQueryDto } from "../../dtos/budget/BudgetQuery.dto";
import type { BudgetResponseDto } from "../../dtos/budget/BudgetResponse.dto";
import type { DeleteResponseDto } from "../../dtos/common/DeleteResponse.dto";
import type { PaginatedResult } from "../../repositories/interfaces/IBaseRepository";
import { NotFoundError, ValidationError, ConflictError } from "../../utils/errors/ClientErrors";
import type { BudgetProgressDto } from "../../dtos/budget/BudgetProgress.dto";
import { toBudgetResponse, toBudgetResponseWithCalculations } from "../../mappers/budget.mapper";
import { toDeleteResponse } from "../../mappers/delete-response.mapper";
import { parseOrThrow } from "../../utils/helpers/zodParse";
import { CreateBudgetSchema } from "../../dtos/budget/CreateBudget.dto";
import { UpdateBudgetSchema } from "../../dtos/budget/UpdateBudget.dto";
import { UpdateBudgetLimitSchema } from "../../dtos/budget/UpdateBudgetLimit.dto";
import { BudgetQuerySchema } from "../../dtos/budget/BudgetQuery.dto";
import type { ICache } from "../../redis";
import { env } from "../../config/env";
import type { ServiceContext } from "../serviceContext";
import { repoOptions, withServiceSignal } from "../serviceContext";

const BUDGET_LIST_CACHE_PREFIX = "budget:list";
const BUDGET_ITEM_CACHE_PREFIX = "budget:item";
const BUDGET_PROGRESS_CACHE_PREFIX = "budget:progress";

function buildBudgetListCacheKey(userId: string, query: BudgetQueryDto): string {
  const accountId = query.accountId ?? "";
  const categoryId = query.categoryId ?? "";
  const activeNow = query.activeNow === true ? "1" : query.activeNow === false ? "0" : "";
  const from = query.from?.toISOString() ?? "";
  const to = query.to?.toISOString() ?? "";
  return [
    BUDGET_LIST_CACHE_PREFIX,
    userId,
    accountId,
    categoryId,
    activeNow,
    from,
    to,
    query.page,
    query.limit,
  ].join(":");
}

function buildBudgetItemCacheKey(userId: string, budgetId: string): string {
  return `${BUDGET_ITEM_CACHE_PREFIX}:${userId}:${budgetId}`;
}

function buildBudgetProgressCacheKey(userId: string, targetDate: Date): string {
  return `${BUDGET_PROGRESS_CACHE_PREFIX}:${userId}:${targetDate.toISOString()}`;
}

export class BudgetService implements IBudgetService {
  constructor(
    private readonly budgetRepo: IBudgetRepository,
    private readonly accountRepo: IAccountRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly currencyRepo: ICurrencyRepository,
    private readonly cache: ICache,
  ) {}

  async listBudgets(
    userId: string,
    query: BudgetQueryDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<BudgetResponseDto>> {
    const validatedQuery = parseOrThrow(BudgetQuerySchema, query);
    const cacheKey = buildBudgetListCacheKey(userId, validatedQuery);

    const cached = await withServiceSignal(
      this.cache.getJson<PaginatedResult<BudgetResponseDto>>(cacheKey),
      ctx,
    );
    if (cached) {
      return cached;
    }

    const result = await this.budgetRepo.findByFilter(
      {
        userId,
        accountId: validatedQuery.accountId,
        categoryId: validatedQuery.categoryId,
        activeNow: validatedQuery.activeNow,
        from: validatedQuery.from,
        to: validatedQuery.to,
      },
      { page: validatedQuery.page, limit: validatedQuery.limit },
      repoOptions(ctx),
    );

    const mapped = {
      ...result,
      data: result.data.map(toBudgetResponse),
    };

    await withServiceSignal(
      this.cache.setJson(cacheKey, mapped, env.BUDGET_LIST_CACHE_TTL_SECONDS),
      ctx,
    );
    return mapped;
  }

  async getBudgetById(
    userId: string,
    budgetId: string,
    ctx?: ServiceContext,
  ): Promise<BudgetResponseDto> {
    const cacheKey = buildBudgetItemCacheKey(userId, budgetId);

    const cached = await withServiceSignal(this.cache.getJson<BudgetResponseDto>(cacheKey), ctx);
    if (cached) {
      return cached;
    }

    const budget = await this.budgetRepo.findActiveById(budgetId, userId, repoOptions(ctx));
    if (!budget) {
      throw new NotFoundError("Budget not found");
    }

    const spentAmount = await this.#calculateSpentAmount(
      userId,
      budget.accountId,
      budget.categoryId,
      budget.periodStart,
      budget.periodEnd,
      repoOptions(ctx),
    );
    const limitAmount = this.#toNumber(budget.limitAmount);
    const remainingAmount = Math.max(0, limitAmount - spentAmount);

    const response = toBudgetResponseWithCalculations(budget, spentAmount, remainingAmount);
    await withServiceSignal(
      this.cache.setJson(cacheKey, response, env.BUDGET_ITEM_CACHE_TTL_SECONDS),
      ctx,
    );
    return response;
  }

  async createBudget(
    userId: string,
    dto: CreateBudgetDto,
    ctx?: ServiceContext,
  ): Promise<BudgetResponseDto> {
    const validated = parseOrThrow(CreateBudgetSchema, dto);
    this.#validatePeriods(validated.periodStart, validated.periodEnd);
    this.#validateAmount(validated.limitAmount);

    const account = await this.accountRepo.findByIdWithCurrency(
      validated.accountId,
      userId,
      repoOptions(ctx),
    );

    if (!account) {
      throw new NotFoundError(`Account '${validated.accountId}' not found or access denied`);
    }

    if (account.currencyId !== validated.currencyId) {
      throw new ValidationError("Budget currency must match the account currency");
    }

    if (validated.categoryId) {
      const category = await this.categoryRepo.findById(validated.categoryId, repoOptions(ctx));

      if (!category || category.isDeleted || category.userId !== userId) {
        throw new NotFoundError("Category");
      }

      if (category.kind !== "EXPENSE") {
        throw new ValidationError("Budgets can only be set for expense categories");
      }
    }

    const periodStart = new Date(validated.periodStart);
    const periodEnd = new Date(validated.periodEnd);

    const hasOverlap = await this.budgetRepo.findOverlapping(
      userId,
      validated.accountId,
      validated.categoryId ?? null,
      periodStart,
      periodEnd,
      undefined,
      repoOptions(ctx),
    );

    if (hasOverlap) {
      throw new ConflictError("An active budget already overlaps with this period");
    }

    const createData: Record<string, unknown> = {
      userId,
      accountId: validated.accountId,
      currencyId: validated.currencyId,
      categoryId: validated.categoryId ?? null,
      name: validated.name.trim(),
      periodStart,
      periodEnd,
      limitAmount: validated.limitAmount,
    };

    const created = await this.budgetRepo.create(createData, repoOptions(ctx));
    await this.invalidateUserBudgetCache(userId, undefined, ctx);
    return toBudgetResponse(created);
  }

  async updateBudget(
    userId: string,
    budgetId: string,
    dto: UpdateBudgetDto,
    ctx?: ServiceContext,
  ): Promise<BudgetResponseDto> {
    const validated = parseOrThrow(UpdateBudgetSchema, dto);
    const budget = await this.budgetRepo.findActiveById(budgetId, userId, repoOptions(ctx));

    if (!budget) {
      throw new NotFoundError("Budget not found");
    }

    const periodStart = validated.periodStart
      ? new Date(validated.periodStart)
      : budget.periodStart;
    const periodEnd = validated.periodEnd ? new Date(validated.periodEnd) : budget.periodEnd;

    if (validated.periodStart != null || validated.periodEnd != null) {
      this.#validatePeriods(periodStart, periodEnd);
      const hasOverlap = await this.budgetRepo.findOverlapping(
        userId,
        budget.accountId,
        budget.categoryId,
        periodStart,
        periodEnd,
        budgetId,
        repoOptions(ctx),
      );
      if (hasOverlap) {
        throw new ConflictError("An active budget already overlaps with this period");
      }
    }

    if (validated.limitAmount != null) {
      this.#validateAmount(validated.limitAmount);
    }

    const updateData: Record<string, unknown> = {
      ...(validated.name != null && { name: validated.name.trim() }),
      ...(validated.periodStart != null && { periodStart }),
      ...(validated.periodEnd != null && { periodEnd }),
      ...(validated.limitAmount != null && { limitAmount: validated.limitAmount }),
    };

    const updated = await this.budgetRepo.update(budgetId, updateData, repoOptions(ctx));
    await this.invalidateUserBudgetCache(userId, budgetId, ctx);
    return toBudgetResponse(updated);
  }

  async updateBudgetLimit(
    userId: string,
    budgetId: string,
    dto: UpdateBudgetLimitDto,
    ctx?: ServiceContext,
  ): Promise<BudgetResponseDto> {
    const validated = parseOrThrow(UpdateBudgetLimitSchema, dto);
    this.#validateAmount(validated.limitAmount);

    const budget = await this.budgetRepo.findActiveById(budgetId, userId, repoOptions(ctx));

    if (!budget) {
      throw new NotFoundError("Budget not found");
    }

    const updateData: Record<string, unknown> = {
      limitAmount: validated.limitAmount,
    };

    const updated = await this.budgetRepo.update(budgetId, updateData, repoOptions(ctx));
    await this.invalidateUserBudgetCache(userId, budgetId, ctx);
    return toBudgetResponse(updated);
  }

  async deleteBudget(
    userId: string,
    budgetId: string,
    ctx?: ServiceContext,
  ): Promise<DeleteResponseDto> {
    const budget = await this.budgetRepo.findActiveById(budgetId, userId, repoOptions(ctx));

    if (!budget) {
      throw new NotFoundError("Budget not found");
    }

    const deleted = await this.budgetRepo.softDelete(budgetId, repoOptions(ctx));
    await this.invalidateUserBudgetCache(userId, budgetId, ctx);
    return toDeleteResponse(deleted);
  }

  async getBudgetsProgress(
    userId: string,
    targetDate: Date,
    ctx?: ServiceContext,
  ): Promise<BudgetProgressDto[]> {
    const queryDate = new Date(targetDate);
    const cacheKey = buildBudgetProgressCacheKey(userId, queryDate);

    const cached = await withServiceSignal(this.cache.getJson<BudgetProgressDto[]>(cacheKey), ctx);
    if (cached) {
      return cached;
    }

    const activeBudgets = await this.budgetRepo.findActiveByDateRange(
      userId,
      queryDate,
      repoOptions(ctx),
    );

    const progressPromises = activeBudgets.map(async (budget) => {
      const spentAmount = await this.#calculateSpentAmount(
        userId,
        budget.accountId,
        budget.categoryId,
        budget.periodStart,
        budget.periodEnd,
        repoOptions(ctx),
      );

      const limitAmount = this.#toNumber(budget.limitAmount);
      const remainingAmount = Math.max(0, limitAmount - spentAmount);

      const currency = await this.currencyRepo.findById(budget.currencyId, repoOptions(ctx));
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

    const result = await Promise.all(progressPromises);
    await withServiceSignal(
      this.cache.setJson(cacheKey, result, env.BUDGET_PROGRESS_CACHE_TTL_SECONDS),
      ctx,
    );
    return result;
  }

  private async invalidateUserBudgetCache(
    userId: string,
    budgetId?: string,
    ctx?: ServiceContext,
  ): Promise<void> {
    const prefixes = [
      `${BUDGET_LIST_CACHE_PREFIX}:${userId}:`,
      `${BUDGET_PROGRESS_CACHE_PREFIX}:${userId}:`,
    ];

    for (const prefix of prefixes) {
      const keys = await withServiceSignal(this.cache.keys(`${prefix}*`), ctx);
      await Promise.all(keys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));
    }

    if (budgetId) {
      await withServiceSignal(this.cache.delete(buildBudgetItemCacheKey(userId, budgetId)), ctx);
    }
  }

  async #calculateSpentAmount(
    userId: string,
    accountId: string,
    categoryId: string | null,
    periodStart: Date,
    periodEnd: Date,
    ctx?: ServiceContext,
  ): Promise<number> {
    return this.transactionRepo.sumExpenseAmount(
      {
        userId,
        accountId,
        direction: "EXPENSE",
        from: periodStart,
        to: periodEnd,
        ...(categoryId && { categoryId }),
      },
      repoOptions(ctx),
    );
  }

  #toNumber(value: unknown): number {
    if (value == null) return 0;
    if (typeof value === "number") return value;

    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }

    if (typeof value !== "object") return 0;

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
