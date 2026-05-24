import { AccountService } from "../../../src/services/impl/AccountService";
import type { IAccountRepository } from "../../../src/repositories/interfaces/IAccountRepository";
import type { ICache } from "../../../src/redis";
import { ConflictError, NotFoundError } from "../../../src/utils/errors/ClientErrors";
import type { Account } from "../../../src/generated/prisma/client";

describe("AccountService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const accountId = "clk7v9x1k0000qzq8x8x8x8xb";
  const currencyId = "clm7v9x1k0000qzq8x8x8x8xc";
  const otherUserId = "cln7v9x1k0000qzq8x8x8x8x1";

  let accountRepo: jest.Mocked<IAccountRepository>;
  let cache: jest.Mocked<ICache>;
  let service: AccountService;

  const makeAccount = (overrides: Partial<Account> = {}): Account => ({
    id: accountId,
    userId,
    currencyId,
    name: "Main",
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    deletedAt: null,
    isDeleted: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    accountRepo = {
      findById: jest.fn(),
      findByIdWithCurrency: jest.fn(),
      findByFilter: jest.fn(),
      hasActiveDependencies: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findAll: jest.fn(),
      findMany: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<IAccountRepository>;

    cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ICache>;

    service = new AccountService(accountRepo, cache);
  });

  describe("createAccount", () => {
    it("має створити рахунок і інвалідувати кеш списку", async () => {
      const created = makeAccount();
      accountRepo.create.mockResolvedValue(created);

      const result = await service.createAccount({ name: "Main", currencyId }, { id: userId });

      expect(result.id).toBe(accountId);
      expect(result).not.toHaveProperty("note");
      expect(accountRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          currencyId,
          name: "Main",
        }),
        undefined,
      );
      expect(cache.keys).toHaveBeenCalled();
    });
  });

  describe("getAccount", () => {
    it("має повернути рахунок з кешу", async () => {
      const cached = {
        id: accountId,
        userId,
        currencyId,
        name: "Main",
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-05-01T00:00:00.000Z",
        isDeleted: false,
      };
      cache.getJson.mockResolvedValue(cached);

      const result = await service.getAccount({ id: accountId }, { id: userId });

      expect(result).toEqual(cached);
      expect(accountRepo.findById).not.toHaveBeenCalled();
    });

    it("має кинути NotFoundError для чужого рахунку", async () => {
      accountRepo.findById.mockResolvedValue(makeAccount({ userId: otherUserId }));

      await expect(service.getAccount({ id: accountId }, { id: userId })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("має кинути NotFoundError для видаленого рахунку", async () => {
      accountRepo.findById.mockResolvedValue(makeAccount({ isDeleted: true }));

      await expect(service.getAccount({ id: accountId }, { id: userId })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("має завантажити рахунок з репозиторію та закешувати", async () => {
      accountRepo.findById.mockResolvedValue(makeAccount());

      const result = await service.getAccount({ id: accountId }, { id: userId });

      expect(result.id).toBe(accountId);
      expect(cache.setJson).toHaveBeenCalledWith(
        `account:item:${userId}:${accountId}`,
        expect.objectContaining({ id: accountId }),
        expect.any(Number),
      );
    });
  });

  describe("getAccounts", () => {
    it("за замовчуванням фільтрує лише активні", async () => {
      accountRepo.findByFilter.mockResolvedValue({
        data: [makeAccount()],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      await service.getAccounts({ page: 1, limit: 20, includeDeleted: false }, { id: userId });

      expect(accountRepo.findByFilter).toHaveBeenCalledWith(
        expect.objectContaining({ userId, isDeleted: false }),
        expect.any(Object),
        undefined,
      );
    });

    it("includeDeleted=true не передає isDeleted у фільтр", async () => {
      accountRepo.findByFilter.mockResolvedValue({
        data: [makeAccount(), makeAccount({ id: "cln7v9x1k0000qzq8x8x8x8x2", isDeleted: true })],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      await service.getAccounts({ page: 1, limit: 20, includeDeleted: true }, { id: userId });

      expect(accountRepo.findByFilter).toHaveBeenCalledWith(
        expect.objectContaining({ userId, isDeleted: undefined }),
        expect.any(Object),
        undefined,
      );
    });
  });

  describe("updateAccount", () => {
    it("має оновити назву рахунку", async () => {
      accountRepo.findById.mockResolvedValue(makeAccount());
      accountRepo.update.mockResolvedValue(makeAccount({ name: "Savings" }));

      const result = await service.updateAccount(
        { name: "Savings" },
        { id: accountId },
        { id: userId },
      );

      expect(result.name).toBe("Savings");
      expect(accountRepo.update).toHaveBeenCalledWith(accountId, { name: "Savings" }, undefined);
    });
  });

  describe("deleteAccount", () => {
    it("має soft-delete рахунок без залежностей", async () => {
      accountRepo.findById.mockResolvedValue(makeAccount());
      accountRepo.hasActiveDependencies.mockResolvedValue(false);
      accountRepo.softDelete.mockResolvedValue(makeAccount({ isDeleted: true }));

      const result = await service.deleteAccount({ id: accountId }, { id: userId });

      expect(result.isDeleted).toBe(true);
      expect(accountRepo.softDelete).toHaveBeenCalledWith(accountId, undefined);
    });

    it("має кинути ConflictError при активних залежностях", async () => {
      accountRepo.findById.mockResolvedValue(makeAccount());
      accountRepo.hasActiveDependencies.mockResolvedValue(true);

      await expect(service.deleteAccount({ id: accountId }, { id: userId })).rejects.toThrow(
        ConflictError,
      );
      expect(accountRepo.softDelete).not.toHaveBeenCalled();
    });
  });
});
