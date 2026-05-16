import { prisma as globalPrisma } from "../../config/prismaClient";
import type { Budget } from "../../generated/prisma/client";
import type {
  IBudgetService,
  CreateBudgetDTO,
  UpdateBudgetLimitDTO,
  BudgetProgressDTO,
} from "../interfaces/IBudgetService";
import type { RequestOptions } from "../../repositories/interfaces/IBaseRepository";
import type { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../utils/errors/AppError";

interface BudgetRequestOptions extends RequestOptions {
  tx?: Prisma.TransactionClient;
}

/**
 * ============================================================================
 * БІЗНЕС-ПРАВИЛА ТА ІНВАРІАНТИ ДЛЯ СУТНОСТІ "BUDGET" (БЮДЖЕТ)
 * ============================================================================
 *
 * 1. БЕЗПЕКА ТА ІЗОЛЯЦІЯ:
 *    Користувач може управляти та переглядати бюджети лише для своїх власних
 *    рахунків (Account) та категорій (Category). Будь-які маніпуляції з чужими
 *    ID перериваються помилкою 404/403.
 *
 * 2. СУВОРЕ ВАЛЮТНЕ КОНВЕНЦІЮВАННЯ:
 *    Валюта ліміту бюджету (`currencyId`) повинна ЖОРСТКО збігатися з базовою
 *    валютою обраного рахунку (`account.currencyId`). Оскільки багатовалютна
 *    конвертація винесена поза скоуп MVP, пряме змішування валют заборонено.
 *
 * 3. КОНТРОЛЬ ФІНАНСОВИХ ПЕРІОДІВ:
 *    - Дата початку бюджету (`periodStart`) має бути суворо раніше за дату
 *      завершення періду (`periodEnd`).
 *    - ЗАБОРОНЕНО перетинання періодів: для одного і того самого рахунку та
 *      однієї і тієї самої категорії (або загального рахунку) не може існувати
 *      двох активних (`isDeleted: false`) лімітів, часові проміжки яких перетинаються.
 *
 * 4. ОБМЕЖЕННЯ ЦІЛЬОВОГО ПРИЗНАЧЕННЯ:
 *    Бюджети мають сенс лише для відстеження витрат. Якщо ліміт прив'язується
 *    до категорії, її тип повинен мати суворий напрямок `CategoryKind.EXPENSE`.
 *
 * 5. АГРЕГАЦІЯ ТА ПРОГРЕС (ПЛАН vs ФАКТ):
 *    При розрахунку прогресу бюджету, система динамічно підраховує суму всіх
 *    активних фінансових транзакцій з типом `EXPENSE` за вказаний період
 *    (`occurredAt` між `periodStart` та `periodEnd`), які належать до обраного
 *    рахунку та (опціонально) категорії.
 */

export class BudgetService implements IBudgetService {
  async createBudget(dto: CreateBudgetDTO, options?: BudgetRequestOptions): Promise<Budget> {
    const tx = options?.tx ?? globalPrisma;

    if (new Date(dto.periodStart) >= new Date(dto.periodEnd)) {
      throw new AppError(
        "INVALID_PERIOD_RANGE",
        "Дата початку періоду має бути раніше за дату завершення",
        400,
      );
    }

    const account = await tx.account.findUnique({
      where: { id: dto.accountId, isDeleted: false },
      include: { currency: true },
    });

    if (account?.userId !== dto.userId) {
      throw new AppError("ACCOUNT_NOT_FOUND", "Обраний рахунок не знайдено", 404);
    }

    if (account.currencyId !== dto.currencyId) {
      throw new AppError(
        "CURRENCY_MISMATCH",
        "Валюта бюджету повинна відповідати валюті обраного рахунку",
        400,
      );
    }

    if (dto.categoryId) {
      const category = await tx.category.findUnique({
        where: { id: dto.categoryId, isDeleted: false },
      });

      if (category?.userId !== dto.userId) {
        throw new AppError("CATEGORY_NOT_FOUND", "Обрану категорію не знайдено", 404);
      }

      if (category.kind !== "EXPENSE") {
        throw new AppError(
          "INVALID_BUDGET_CATEGORY_KIND",
          "Бюджет можна встановити лише для категорій витрат (EXPENSE)",
          400,
        );
      }
    }

    if (dto.limitAmount <= 0) {
      throw new AppError(
        "INVALID_LIMIT_AMOUNT",
        "Сума ліміту бюджету повинна бути більшою за нуль",
        400,
      );
    }

    const overlappingBudget = await tx.budget.findFirst({
      where: {
        userId: dto.userId,
        accountId: dto.accountId,
        categoryId: dto.categoryId ?? null,
        isDeleted: false,
        NOT: {
          OR: [
            { periodEnd: { lt: new Date(dto.periodStart) } },
            { periodStart: { gt: new Date(dto.periodEnd) } },
          ],
        },
      },
    });

    if (overlappingBudget) {
      throw new AppError(
        "BUDGET_PERIOD_OVERLAP",
        "На вказаний проміжок часу для цього рахунку/категорії вже встановлено активний бюджет",
        400,
      );
    }

    return tx.budget.create({
      data: {
        userId: dto.userId,
        accountId: dto.accountId,
        currencyId: dto.currencyId,
        categoryId: dto.categoryId ?? null,
        name: dto.name.trim(),
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        limitAmount: dto.limitAmount,
      },
    });
  }

  async updateBudgetLimit(
    userId: string,
    budgetId: string,
    dto: UpdateBudgetLimitDTO,
    options?: BudgetRequestOptions,
  ): Promise<Budget> {
    const tx = options?.tx ?? globalPrisma;

    const budget = await tx.budget.findUnique({
      where: { id: budgetId, userId, isDeleted: false },
    });

    if (!budget) {
      throw new AppError("BUDGET_NOT_FOUND", "Бюджет не знайдено", 404);
    }

    if (dto.limitAmount <= 0) {
      throw new AppError(
        "INVALID_LIMIT_AMOUNT",
        "Сума ліміту бюджету повинна бути більшою за нуль",
        400,
      );
    }

    return tx.budget.update({
      where: { id: budgetId },
      data: { limitAmount: dto.limitAmount },
    });
  }

  async deleteBudget(
    userId: string,
    budgetId: string,
    options?: BudgetRequestOptions,
  ): Promise<void> {
    const tx = options?.tx ?? globalPrisma;

    const budget = await tx.budget.findUnique({
      where: { id: budgetId, userId, isDeleted: false },
    });

    if (!budget) {
      throw new AppError("BUDGET_NOT_FOUND", "Бюджет не знайдено або вже видалено", 404);
    }

    await tx.budget.update({
      where: { id: budgetId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async getBudgetsProgress(
    userId: string,
    targetDate: Date,
    options?: BudgetRequestOptions,
  ): Promise<BudgetProgressDTO[]> {
    const tx = options?.tx ?? globalPrisma;
    const queryDate = new Date(targetDate);

    const activeBudgets = await tx.budget.findMany({
      where: {
        userId,
        isDeleted: false,
        periodStart: { lte: queryDate },
        periodEnd: { gte: queryDate },
      },
      include: {
        currency: true,
      },
    });

    const progressReports: BudgetProgressDTO[] = [];

    for (const budget of activeBudgets) {
      const txWhereClause: Prisma.TransactionWhereInput = {
        userId,
        accountId: budget.accountId,
        direction: "EXPENSE",
        isDeleted: false,
        occurredAt: {
          gte: budget.periodStart,
          lte: budget.periodEnd,
        },
      };

      if (budget.categoryId) {
        txWhereClause.categoryId = budget.categoryId;
      }

      const aggregation = await tx.transaction.aggregate({
        where: txWhereClause,
        _sum: {
          amount: true,
        },
      });

      const spentAmount = aggregation._sum.amount ? Number(aggregation._sum.amount) : 0;
      const limitAmount = Number(budget.limitAmount);

      const remainingAmount = Math.max(0, limitAmount - spentAmount);
      const isExceeded = spentAmount > limitAmount;

      progressReports.push({
        id: budget.id,
        name: budget.name,
        limitAmount,
        spentAmount,
        remainingAmount,
        isExceeded,
        periodStart: budget.periodStart,
        periodEnd: budget.periodEnd,
        accountId: budget.accountId,
        categoryId: budget.categoryId,
        currencyCode: budget.currency.code,
      });
    }

    return progressReports;
  }
}
