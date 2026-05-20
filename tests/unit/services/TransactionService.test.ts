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
});
