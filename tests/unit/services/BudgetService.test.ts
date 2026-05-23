import { BudgetService } from "../../../src/services/impl/BudgetService";
import type { IBudgetRepository } from "../../../src/repositories/interfaces/IBudgetRepository";
import type { IAccountRepository } from "../../../src/repositories/interfaces/IAccountRepository";
import type { ICategoryRepository } from "../../../src/repositories/interfaces/ICategoryRepository";
import type { ITransactionRepository } from "../../../src/repositories/interfaces/ITransactionRepository";
import type { ICurrencyRepository } from "../../../src/repositories/interfaces/ICurrencyRepository";
import type { ICache } from "../../../src/redis";
import { Decimal } from "@prisma/client/runtime/client";

describe("BudgetService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const budgetId = "clk7v9x1k0000qzq8x8x8x8xb";

  let budgetRepo: jest.Mocked<IBudgetRepository>;
  let accountRepo: jest.Mocked<IAccountRepository>;
  let categoryRepo: jest.Mocked<ICategoryRepository>;
  let transactionRepo: jest.Mocked<ITransactionRepository>;
  let currencyRepo: jest.Mocked<ICurrencyRepository>;
  let cache: jest.Mocked<ICache>;
  let service: BudgetService;

  beforeEach(() => {
    jest.clearAllMocks();

    budgetRepo = {
      findByFilter: jest.fn(),
      findActiveById: jest.fn(),
      findActiveByDateRange: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findOverlapping: jest.fn(),
    } as unknown as jest.Mocked<IBudgetRepository>;

    accountRepo = {} as unknown as jest.Mocked<IAccountRepository>;
    categoryRepo = {} as unknown as jest.Mocked<ICategoryRepository>;
    transactionRepo = {
      sumExpenseAmount: jest.fn(),
    } as unknown as jest.Mocked<ITransactionRepository>;
    currencyRepo = {} as unknown as jest.Mocked<ICurrencyRepository>;

    cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ICache>;

    service = new BudgetService(
      budgetRepo,
      accountRepo,
      categoryRepo,
      transactionRepo,
      currencyRepo,
      cache,
    );
  });

  describe("listBudgets", () => {
    it("uses cache key with query filters", async () => {
      budgetRepo.findByFilter.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.listBudgets(userId, {
        page: 1,
        limit: 20,
        activeNow: undefined,
        from: undefined,
        to: undefined,
      });

      expect(cache.getJson).toHaveBeenCalledWith(
        expect.stringMatching(/^budget:list:clg7v9x1k0000qzq8x8x8x8x8:/),
      );
      expect(budgetRepo.findByFilter).toHaveBeenCalled();
    });

    it("maps Prisma Decimal limitAmount to number in response", async () => {
      budgetRepo.findByFilter.mockResolvedValue({
        data: [
          {
            id: budgetId,
            userId,
            accountId: "clh7v9x1k0000qzq8x8x8x8x9",
            currencyId: "clj7v9x1k0000qzq8x8x8x8xa",
            categoryId: null,
            name: "Groceries",
            limitAmount: new Decimal("1500.5000"),
            periodStart: new Date("2026-05-01T00:00:00.000Z"),
            periodEnd: new Date("2026-05-31T23:59:59.999Z"),
            createdAt: new Date("2026-05-01T00:00:00.000Z"),
            updatedAt: new Date("2026-05-01T00:00:00.000Z"),
            deletedAt: null,
            isDeleted: false,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.listBudgets(userId, {
        page: 1,
        limit: 20,
        activeNow: undefined,
        from: undefined,
        to: undefined,
      });

      expect(result.data[0]?.limitAmount).toBe(1500.5);
    });
  });

  describe("getBudgetsProgress", () => {
    it("caches progress result with short TTL", async () => {
      budgetRepo.findActiveByDateRange.mockResolvedValue([]);

      const targetDate = new Date("2026-05-15T00:00:00.000Z");
      await service.getBudgetsProgress(userId, targetDate);

      expect(cache.setJson).toHaveBeenCalledWith(
        `budget:progress:${userId}:${targetDate.toISOString()}`,
        [],
        60,
      );
    });
  });

  describe("deleteBudget", () => {
    it("invalidates budget cache keys", async () => {
      budgetRepo.findActiveById.mockResolvedValue({
        id: budgetId,
        userId,
      } as never);
      budgetRepo.softDelete.mockResolvedValue({
        id: budgetId,
        isDeleted: true,
        deletedAt: new Date(),
      } as never);

      await service.deleteBudget(userId, budgetId);

      expect(cache.keys).toHaveBeenCalledWith(`budget:list:${userId}:*`);
      expect(cache.keys).toHaveBeenCalledWith(`budget:progress:${userId}:*`);
      expect(cache.delete).toHaveBeenCalledWith(`budget:item:${userId}:${budgetId}`);
    });
  });
});
