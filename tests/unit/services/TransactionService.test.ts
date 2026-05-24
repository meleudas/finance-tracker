import { TransactionService } from "../../../src/services/impl/TransactionService";
import type { ITransactionRepository } from "../../../src/repositories/interfaces/ITransactionRepository";
import type { IAccountRepository } from "../../../src/repositories/interfaces/IAccountRepository";
import type { ICategoryRepository } from "../../../src/repositories/interfaces/ICategoryRepository";
import type { IAttachmentRepository } from "../../../src/repositories/interfaces/IAttachmentRepository";
import type { ICache } from "../../../src/redis";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../src/utils/errors/ClientErrors";
import type { Transaction } from "../../../src/generated/prisma/client";

describe("TransactionService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const otherUserId = "cln7v9x1k0000qzq8x8x8x8x1";
  const accountId = "clk7v9x1k0000qzq8x8x8x8xb";
  const currencyId = "clm7v9x1k0000qzq8x8x8x8xc";
  const categoryId = "cln7v9x1k0000qzq8x8x8x8x2";
  const transactionId = "clo7v9x1k0000qzq8x8x8x8x3";

  let transactionRepo: jest.Mocked<ITransactionRepository>;
  let accountRepo: jest.Mocked<IAccountRepository>;
  let categoryRepo: jest.Mocked<ICategoryRepository>;
  let attachmentRepo: jest.Mocked<IAttachmentRepository>;
  let cache: jest.Mocked<ICache>;
  let service: TransactionService;

  const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: transactionId,
    userId,
    accountId,
    currencyId,
    categoryId,
    amount: 100 as unknown as Transaction["amount"],
    direction: "EXPENSE",
    occurredAt: new Date("2026-05-01T12:00:00.000Z"),
    note: null,
    recurringRuleId: null,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    deletedAt: null,
    isDeleted: false,
    ...overrides,
  });

  const makeAccountWithCurrency = () => ({
    ...makeTransaction(),
    id: accountId,
    userId,
    currencyId,
    name: "Main",
    currency: {
      id: currencyId,
      code: "UAH",
      name: "Hryvnia",
      minorUnits: 2,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    transactionRepo = {
      findById: jest.fn(),
      findByFilter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findAll: jest.fn(),
      findMany: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findByUserId: jest.fn(),
      findByAccountId: jest.fn(),
      findByCategoryId: jest.fn(),
      sumExpenseAmount: jest.fn(),
    } as unknown as jest.Mocked<ITransactionRepository>;

    accountRepo = {
      findByIdWithCurrency: jest.fn(),
    } as unknown as jest.Mocked<IAccountRepository>;

    categoryRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ICategoryRepository>;

    attachmentRepo = {
      findByTransactionId: jest.fn(),
    } as unknown as jest.Mocked<IAttachmentRepository>;

    cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ICache>;

    service = new TransactionService(
      transactionRepo,
      accountRepo,
      categoryRepo,
      attachmentRepo,
      cache,
    );
  });

  describe("createTransaction", () => {
    const createDto = {
      accountId,
      currencyId,
      categoryId,
      amount: 50,
      direction: "EXPENSE" as const,
      occurredAt: "2026-05-01T12:00:00.000Z",
    };

    it("має створити транзакцію після валідації рахунку та категорії", async () => {
      accountRepo.findByIdWithCurrency.mockResolvedValue(makeAccountWithCurrency() as never);
      categoryRepo.findById.mockResolvedValue({
        id: categoryId,
        userId,
        name: "Food",
        kind: "EXPENSE",
        parentId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      transactionRepo.create.mockResolvedValue(makeTransaction());

      const result = await service.createTransaction(createDto, { id: userId });

      expect(result.id).toBe(transactionId);
      expect(transactionRepo.create).toHaveBeenCalled();
      expect(cache.keys).toHaveBeenCalledWith(`transaction-list:${userId}:*`);
      expect(cache.keys).toHaveBeenCalledWith(`budget:list:${userId}:*`);
    });

    it("має кинути NotFoundError для чужого рахунку", async () => {
      accountRepo.findByIdWithCurrency.mockResolvedValue(null);

      await expect(service.createTransaction(createDto, { id: userId })).rejects.toThrow(
        NotFoundError,
      );
      expect(transactionRepo.create).not.toHaveBeenCalled();
    });

    it("має кинути ValidationError при невідповідній валюті", async () => {
      accountRepo.findByIdWithCurrency.mockResolvedValue(makeAccountWithCurrency() as never);

      await expect(
        service.createTransaction(
          { ...createDto, currencyId: "clx7v9x1k0000qzq8x8x8x8x9" },
          { id: userId },
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("має кинути ValidationError якщо kind категорії не збігається з direction", async () => {
      accountRepo.findByIdWithCurrency.mockResolvedValue(makeAccountWithCurrency() as never);
      categoryRepo.findById.mockResolvedValue({
        id: categoryId,
        userId,
        name: "Salary",
        kind: "INCOME",
        parentId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      await expect(service.createTransaction(createDto, { id: userId })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("getTransaction", () => {
    it("повертає транзакцію з кешу", async () => {
      const cached = { id: transactionId, userId };
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getTransaction({ id: transactionId }, { id: userId });

      expect(result).toEqual(cached);
      expect(transactionRepo.findById).not.toHaveBeenCalled();
    });

    it("завантажує та кешує транзакцію", async () => {
      transactionRepo.findById.mockResolvedValue(makeTransaction());

      const result = await service.getTransaction({ id: transactionId }, { id: userId });

      expect(result.id).toBe(transactionId);
      expect(cache.setJson).toHaveBeenCalled();
    });

    it("має кинути NotFoundError для чужої транзакції", async () => {
      transactionRepo.findById.mockResolvedValue(makeTransaction({ userId: otherUserId }));

      await expect(service.getTransaction({ id: transactionId }, { id: userId })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("deleteTransaction", () => {
    it("має кинути ConflictError якщо є вкладення", async () => {
      transactionRepo.findById.mockResolvedValue(makeTransaction());
      attachmentRepo.findByTransactionId.mockResolvedValue([
        {
          id: "att-1",
          transactionId,
          storageKey: "k",
          mimeType: "image/png",
          originalName: "f.png",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          isDeleted: false,
        },
      ]);

      await expect(
        service.deleteTransaction({ id: transactionId }, { id: userId }),
      ).rejects.toThrow(ConflictError);
      expect(transactionRepo.softDelete).not.toHaveBeenCalled();
    });

    it("має soft-delete без вкладень", async () => {
      transactionRepo.findById.mockResolvedValue(makeTransaction());
      attachmentRepo.findByTransactionId.mockResolvedValue([]);
      transactionRepo.softDelete.mockResolvedValue(makeTransaction({ isDeleted: true }));

      const result = await service.deleteTransaction({ id: transactionId }, { id: userId });

      expect(result.isDeleted).toBe(true);
      expect(transactionRepo.softDelete).toHaveBeenCalledWith(transactionId, undefined);
      expect(cache.keys).toHaveBeenCalledWith(`budget:progress:${userId}:*`);
    });
  });

  describe("updateTransaction", () => {
    const updateDto = { amount: 75 };

    it("оновлює транзакцію після валідації", async () => {
      transactionRepo.findById.mockResolvedValue(makeTransaction());
      accountRepo.findByIdWithCurrency.mockResolvedValue(makeAccountWithCurrency() as never);
      categoryRepo.findById.mockResolvedValue({
        id: categoryId,
        userId,
        kind: "EXPENSE",
        isDeleted: false,
      } as never);
      transactionRepo.update.mockResolvedValue(makeTransaction({ amount: 75 as never }));

      const result = await service.updateTransaction(
        updateDto,
        { id: transactionId },
        { id: userId },
      );

      expect(result.id).toBe(transactionId);
      expect(cache.delete).toHaveBeenCalledWith(`transaction:${userId}:${transactionId}`);
    });

    it("кидає NotFoundError для відсутньої категорії", async () => {
      transactionRepo.findById.mockResolvedValue(makeTransaction());
      accountRepo.findByIdWithCurrency.mockResolvedValue(makeAccountWithCurrency() as never);
      categoryRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateTransaction({ categoryId }, { id: transactionId }, { id: userId }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getTransactions", () => {
    const listQuery = { page: 1, limit: 20 };

    it("повертає список з кешу", async () => {
      const cached = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getTransactions(listQuery, { id: userId });

      expect(result).toBe(cached);
    });

    it("завантажує список з репозиторію", async () => {
      transactionRepo.findByFilter.mockResolvedValue({
        data: [makeTransaction()],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.getTransactions(listQuery, { id: userId });

      expect(result.data).toHaveLength(1);
    });
  });

  describe("getTransactionsByAccountId", () => {
    it("повертає з кешу", async () => {
      const cached = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getTransactionsByAccountId(
        { id: accountId },
        { page: 1, limit: 20 },
        { id: userId },
      );

      expect(result).toBe(cached);
    });
  });

  describe("getTransactionsByCategoryId", () => {
    it("повертає з кешу", async () => {
      const cached = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getTransactionsByCategoryId(
        { id: categoryId },
        { page: 1, limit: 20 },
        { id: userId },
      );

      expect(result).toBe(cached);
    });
  });

  describe("getTransactionsByUserId", () => {
    it("делегує в getTransactions", async () => {
      transactionRepo.findByFilter.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.getTransactionsByUserId({ page: 1, limit: 20 }, { id: userId });

      expect(transactionRepo.findByFilter).toHaveBeenCalled();
    });
  });
});
