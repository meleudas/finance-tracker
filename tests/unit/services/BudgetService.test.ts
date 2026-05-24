import { BudgetService } from "../../../src/services/impl/BudgetService";
import type { IBudgetRepository } from "../../../src/repositories/interfaces/IBudgetRepository";
import type { IAccountRepository } from "../../../src/repositories/interfaces/IAccountRepository";
import type { ICategoryRepository } from "../../../src/repositories/interfaces/ICategoryRepository";
import type { ITransactionRepository } from "../../../src/repositories/interfaces/ITransactionRepository";
import type { ICurrencyRepository } from "../../../src/repositories/interfaces/ICurrencyRepository";
import type { ICache } from "../../../src/redis";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../src/utils/errors/ClientErrors";
import { Decimal } from "@prisma/client/runtime/client";

describe("BudgetService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const budgetId = "clk7v9x1k0000qzq8x8x8x8xb";
  const accountId = "clh7v9x1k0000qzq8x8x8x8x9";
  const currencyId = "clj7v9x1k0000qzq8x8x8x8xa";
  const categoryId = "cln7v9x1k0000qzq8x8x8x8x2";

  let budgetRepo: jest.Mocked<IBudgetRepository>;
  let accountRepo: jest.Mocked<IAccountRepository>;
  let categoryRepo: jest.Mocked<ICategoryRepository>;
  let transactionRepo: jest.Mocked<ITransactionRepository>;
  let currencyRepo: jest.Mocked<ICurrencyRepository>;
  let cache: jest.Mocked<ICache>;
  let service: BudgetService;

  const makeBudget = (overrides: Record<string, unknown> = {}) => ({
    id: budgetId,
    userId,
    accountId,
    currencyId,
    categoryId: null,
    name: "Groceries",
    limitAmount: new Decimal("1000"),
    periodStart: new Date("2026-05-01T00:00:00.000Z"),
    periodEnd: new Date("2026-05-31T23:59:59.999Z"),
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    deletedAt: null,
    isDeleted: false,
    ...overrides,
  });

  const listQuery = {
    page: 1,
    limit: 20,
    activeNow: undefined as boolean | undefined,
    from: undefined as Date | undefined,
    to: undefined as Date | undefined,
  };

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

    accountRepo = {
      findByIdWithCurrency: jest.fn(),
    } as unknown as jest.Mocked<IAccountRepository>;

    categoryRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ICategoryRepository>;

    transactionRepo = {
      sumExpenseAmount: jest.fn().mockResolvedValue(200),
    } as unknown as jest.Mocked<ITransactionRepository>;

    currencyRepo = {
      findById: jest.fn().mockResolvedValue({ id: currencyId, code: "UAH" }),
    } as unknown as jest.Mocked<ICurrencyRepository>;

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
    it("returns cached list on cache hit", async () => {
      const cached = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.listBudgets(userId, listQuery);

      expect(result).toBe(cached);
      expect(budgetRepo.findByFilter).not.toHaveBeenCalled();
    });

    it("uses cache key with query filters and activeNow branches", async () => {
      budgetRepo.findByFilter.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.listBudgets(userId, { ...listQuery, activeNow: true });
      await service.listBudgets(userId, { ...listQuery, activeNow: false });

      expect(cache.getJson).toHaveBeenCalledWith(expect.stringContaining(":1:"));
      expect(cache.getJson).toHaveBeenCalledWith(expect.stringContaining(":0:"));
    });

    it("maps Prisma Decimal limitAmount to number in response", async () => {
      budgetRepo.findByFilter.mockResolvedValue({
        data: [makeBudget({ limitAmount: new Decimal("1500.5000") })],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.listBudgets(userId, listQuery);

      expect(result.data[0]?.limitAmount).toBe(1500.5);
    });
  });

  describe("getBudgetById", () => {
    it("returns cached item on cache hit", async () => {
      const cached = { id: budgetId, limitAmount: 100 };
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getBudgetById(userId, budgetId);

      expect(result).toEqual(cached);
      expect(budgetRepo.findActiveById).not.toHaveBeenCalled();
    });

    it("computes spent and remaining amounts", async () => {
      budgetRepo.findActiveById.mockResolvedValue(makeBudget() as never);
      transactionRepo.sumExpenseAmount.mockResolvedValue(300);

      const result = await service.getBudgetById(userId, budgetId);

      expect(result.spentAmount).toBe(300);
      expect(result.remainingAmount).toBe(700);
      expect(cache.setJson).toHaveBeenCalled();
    });

    it("throws NotFoundError when budget missing", async () => {
      budgetRepo.findActiveById.mockResolvedValue(null);

      await expect(service.getBudgetById(userId, budgetId)).rejects.toThrow(NotFoundError);
    });

    it("handles limitAmount as number, string, and Decimal-like object", async () => {
      budgetRepo.findActiveById
        .mockResolvedValueOnce(makeBudget({ limitAmount: 500 }) as never)
        .mockResolvedValueOnce(makeBudget({ limitAmount: "750.5" }) as never)
        .mockResolvedValueOnce(
          makeBudget({
            limitAmount: { toNumber: () => 900 },
          }) as never,
        );

      transactionRepo.sumExpenseAmount.mockResolvedValue(0);

      await expect(service.getBudgetById(userId, budgetId)).resolves.toMatchObject({
        limitAmount: 500,
      });
      await expect(service.getBudgetById(userId, budgetId)).resolves.toMatchObject({
        limitAmount: 750.5,
      });
      await expect(service.getBudgetById(userId, budgetId)).resolves.toMatchObject({
        limitAmount: 900,
      });
    });
  });

  describe("createBudget", () => {
    const createDto = {
      name: "Food",
      accountId,
      currencyId,
      limitAmount: 1000,
      periodStart: "2026-05-01T00:00:00.000Z",
      periodEnd: "2026-05-31T23:59:59.999Z",
    };

    it("creates budget and invalidates cache", async () => {
      accountRepo.findByIdWithCurrency.mockResolvedValue({
        id: accountId,
        currencyId,
      } as never);
      budgetRepo.findOverlapping.mockResolvedValue(null);
      budgetRepo.create.mockResolvedValue(makeBudget() as never);

      const result = await service.createBudget(userId, createDto);

      expect(result.name).toBe("Groceries");
      expect(cache.keys).toHaveBeenCalled();
    });

    it("throws ValidationError for invalid period", async () => {
      await expect(
        service.createBudget(userId, {
          ...createDto,
          periodStart: "2026-06-01T00:00:00.000Z",
          periodEnd: "2026-05-01T00:00:00.000Z",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError for non-positive limit", async () => {
      await expect(service.createBudget(userId, { ...createDto, limitAmount: 0 })).rejects.toThrow(
        ValidationError,
      );
    });

    it("throws NotFoundError when account missing", async () => {
      accountRepo.findByIdWithCurrency.mockResolvedValue(null);

      await expect(service.createBudget(userId, createDto)).rejects.toThrow(NotFoundError);
    });

    it("throws ValidationError when currency mismatches account", async () => {
      accountRepo.findByIdWithCurrency.mockResolvedValue({
        id: accountId,
        currencyId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      } as never);

      await expect(service.createBudget(userId, createDto)).rejects.toThrow(ValidationError);
    });

    it("validates expense category when categoryId set", async () => {
      accountRepo.findByIdWithCurrency.mockResolvedValue({
        id: accountId,
        currencyId,
      } as never);
      categoryRepo.findById.mockResolvedValue({
        id: categoryId,
        userId,
        kind: "INCOME",
        isDeleted: false,
      } as never);

      await expect(service.createBudget(userId, { ...createDto, categoryId })).rejects.toThrow(
        ValidationError,
      );
    });

    it("throws NotFoundError for missing category", async () => {
      accountRepo.findByIdWithCurrency.mockResolvedValue({
        id: accountId,
        currencyId,
      } as never);
      categoryRepo.findById.mockResolvedValue(null);

      await expect(service.createBudget(userId, { ...createDto, categoryId })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ConflictError on overlapping budget", async () => {
      accountRepo.findByIdWithCurrency.mockResolvedValue({
        id: accountId,
        currencyId,
      } as never);
      categoryRepo.findById.mockResolvedValue({
        id: categoryId,
        userId,
        kind: "EXPENSE",
        isDeleted: false,
      } as never);
      budgetRepo.findOverlapping.mockResolvedValue(makeBudget() as never);

      await expect(service.createBudget(userId, { ...createDto, categoryId })).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("updateBudget", () => {
    it("throws NotFoundError when budget missing", async () => {
      budgetRepo.findActiveById.mockResolvedValue(null);

      await expect(service.updateBudget(userId, budgetId, { name: "New" })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ConflictError when period overlap", async () => {
      budgetRepo.findActiveById.mockResolvedValue(makeBudget() as never);
      budgetRepo.findOverlapping.mockResolvedValue(makeBudget() as never);

      await expect(
        service.updateBudget(userId, budgetId, {
          periodEnd: "2026-06-30T23:59:59.999Z",
        }),
      ).rejects.toThrow(ConflictError);
    });

    it("updates budget and invalidates item cache", async () => {
      budgetRepo.findActiveById.mockResolvedValue(makeBudget() as never);
      budgetRepo.update.mockResolvedValue(makeBudget({ name: "Updated" }) as never);

      const result = await service.updateBudget(userId, budgetId, { name: "Updated" });

      expect(result.name).toBe("Updated");
      expect(cache.delete).toHaveBeenCalledWith(`budget:item:${userId}:${budgetId}`);
    });

    it("rejects invalid limit on update", async () => {
      budgetRepo.findActiveById.mockResolvedValue(makeBudget() as never);

      await expect(service.updateBudget(userId, budgetId, { limitAmount: -1 })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("updateBudgetLimit", () => {
    it("throws NotFoundError when budget missing", async () => {
      budgetRepo.findActiveById.mockResolvedValue(null);

      await expect(
        service.updateBudgetLimit(userId, budgetId, { limitAmount: 500 }),
      ).rejects.toThrow(NotFoundError);
    });

    it("updates limit amount", async () => {
      budgetRepo.findActiveById.mockResolvedValue(makeBudget() as never);
      budgetRepo.update.mockResolvedValue(makeBudget({ limitAmount: new Decimal("500") }) as never);

      const result = await service.updateBudgetLimit(userId, budgetId, { limitAmount: 500 });

      expect(result.limitAmount).toBe(500);
    });
  });

  describe("deleteBudget", () => {
    it("throws NotFoundError when budget missing", async () => {
      budgetRepo.findActiveById.mockResolvedValue(null);

      await expect(service.deleteBudget(userId, budgetId)).rejects.toThrow(NotFoundError);
    });

    it("invalidates budget cache keys", async () => {
      budgetRepo.findActiveById.mockResolvedValue(makeBudget() as never);
      budgetRepo.softDelete.mockResolvedValue({
        id: budgetId,
        isDeleted: true,
        deletedAt: new Date(),
      } as never);
      cache.keys.mockResolvedValue(["budget:list:key1"]);

      await service.deleteBudget(userId, budgetId);

      expect(cache.keys).toHaveBeenCalledWith(`budget:list:${userId}:*`);
      expect(cache.delete).toHaveBeenCalledWith(`budget:item:${userId}:${budgetId}`);
    });
  });

  describe("getBudgetsProgress", () => {
    it("returns cached progress on cache hit", async () => {
      const cached = [{ id: budgetId, name: "Groceries" }];
      cache.getJson.mockResolvedValueOnce(cached);

      const targetDate = new Date("2026-05-15T00:00:00.000Z");
      const result = await service.getBudgetsProgress(userId, targetDate);

      expect(result).toBe(cached);
      expect(budgetRepo.findActiveByDateRange).not.toHaveBeenCalled();
    });

    it("builds progress with exceeded flag and default currency", async () => {
      budgetRepo.findActiveByDateRange.mockResolvedValue([makeBudget()] as never);
      transactionRepo.sumExpenseAmount.mockResolvedValue(1500);
      currencyRepo.findById.mockResolvedValue(null);

      const targetDate = new Date("2026-05-15T00:00:00.000Z");
      const result = await service.getBudgetsProgress(userId, targetDate);

      expect(result[0]?.isExceeded).toBe(true);
      expect(result[0]?.currencyCode).toBe("UAH");
      expect(cache.setJson).toHaveBeenCalledWith(
        `budget:progress:${userId}:${targetDate.toISOString()}`,
        result,
        expect.any(Number),
      );
    });

    it("includes categoryId in spent calculation when set", async () => {
      budgetRepo.findActiveByDateRange.mockResolvedValue([makeBudget({ categoryId })] as never);

      await service.getBudgetsProgress(userId, new Date("2026-05-15T00:00:00.000Z"));

      expect(transactionRepo.sumExpenseAmount).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId }),
        undefined,
      );
    });
  });
});
