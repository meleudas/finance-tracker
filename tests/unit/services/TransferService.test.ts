import { TransferService } from "../../../src/services/impl/TransferService";
import type { ITransferRepository } from "../../../src/repositories/interfaces/ITransferRepository";
import type { IAccountRepository } from "../../../src/repositories/interfaces/IAccountRepository";
import type { ICache } from "../../../src/redis";
import { NotFoundError, ValidationError } from "../../../src/utils/errors/ClientErrors";
import type { Transfer } from "../../../src/generated/prisma/client";

describe("TransferService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const otherUserId = "cln7v9x1k0000qzq8x8x8x8x1";
  const fromAccountId = "clk7v9x1k0000qzq8x8x8x8xb";
  const toAccountId = "clm7v9x1k0000qzq8x8x8x8xc";
  const currencyId = "cln7v9x1k0000qzq8x8x8x8x1";
  const transferId = "clo7v9x1k0000qzq8x8x8x8x3";

  let transferRepo: jest.Mocked<ITransferRepository>;
  let accountRepo: jest.Mocked<IAccountRepository>;
  let cache: jest.Mocked<ICache>;
  let service: TransferService;

  const makeTransfer = (overrides: Partial<Transfer> = {}): Transfer => ({
    id: transferId,
    userId,
    fromAccountId,
    toAccountId,
    currencyId,
    amount: 100 as unknown as Transfer["amount"],
    occurredAt: new Date("2026-05-01T12:00:00.000Z"),
    note: null,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    deletedAt: null,
    isDeleted: false,
    ...overrides,
  });

  const makeAccountWithCurrency = (id: string) => ({
    id,
    userId,
    currencyId,
    name: "Account",
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

  const createPayload = {
    fromAccountId,
    toAccountId,
    currencyId,
    amount: 100,
    occurredAt: "2026-05-01T12:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    transferRepo = {
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
    } as unknown as jest.Mocked<ITransferRepository>;

    accountRepo = {
      findByIdWithCurrency: jest.fn(),
    } as unknown as jest.Mocked<IAccountRepository>;

    cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ICache>;

    service = new TransferService(transferRepo, accountRepo, cache);
  });

  describe("createTransfer", () => {
    it("validates refs and creates transfer", async () => {
      accountRepo.findByIdWithCurrency
        .mockResolvedValueOnce(makeAccountWithCurrency(fromAccountId) as never)
        .mockResolvedValueOnce(makeAccountWithCurrency(toAccountId) as never);
      transferRepo.create.mockResolvedValue(makeTransfer());

      const result = await service.createTransfer(createPayload, { id: userId });

      expect(accountRepo.findByIdWithCurrency).toHaveBeenCalledTimes(2);
      expect(transferRepo.create).toHaveBeenCalled();
      expect(result.id).toBe(transferId);
    });

    it("throws NotFoundError when from account is not owned", async () => {
      accountRepo.findByIdWithCurrency.mockResolvedValueOnce(null);

      await expect(service.createTransfer(createPayload, { id: userId })).rejects.toThrow(
        NotFoundError,
      );
      expect(transferRepo.create).not.toHaveBeenCalled();
    });

    it("throws ValidationError when from and to accounts are the same", async () => {
      await expect(
        service.createTransfer({ ...createPayload, toAccountId: fromAccountId }, { id: userId }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when to account is not owned", async () => {
      accountRepo.findByIdWithCurrency
        .mockResolvedValueOnce(makeAccountWithCurrency(fromAccountId) as never)
        .mockResolvedValueOnce(null);

      await expect(service.createTransfer(createPayload, { id: userId })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError when currency does not match to account", async () => {
      const otherCurrency = "clothercurrency0000000000002";
      accountRepo.findByIdWithCurrency
        .mockResolvedValueOnce(makeAccountWithCurrency(fromAccountId) as never)
        .mockResolvedValueOnce({
          ...makeAccountWithCurrency(toAccountId),
          currencyId: otherCurrency,
        } as never);

      await expect(service.createTransfer(createPayload, { id: userId })).rejects.toThrow(
        ValidationError,
      );
    });

    it("throws ValidationError when currency does not match account", async () => {
      accountRepo.findByIdWithCurrency
        .mockResolvedValueOnce(makeAccountWithCurrency(fromAccountId) as never)
        .mockResolvedValueOnce(makeAccountWithCurrency(toAccountId) as never);

      await expect(
        service.createTransfer(
          { ...createPayload, currencyId: "clothercurrency00000000001" },
          { id: userId },
        ),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("deleteTransfer", () => {
    it("soft-deletes transfer and invalidates cache", async () => {
      transferRepo.findById.mockResolvedValue(makeTransfer());
      transferRepo.softDelete.mockResolvedValue(makeTransfer({ isDeleted: true }));

      const result = await service.deleteTransfer({ id: transferId }, { id: userId });

      expect(result.isDeleted).toBe(true);
      expect(cache.delete).toHaveBeenCalledWith(`transfer:${userId}:${transferId}`);
    });
  });

  describe("getTransfer", () => {
    it("returns cached transfer", async () => {
      const cached = { id: transferId };
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getTransfer({ id: transferId }, { id: userId });

      expect(result).toEqual(cached);
      expect(transferRepo.findById).not.toHaveBeenCalled();
    });

    it("loads transfer and caches response", async () => {
      transferRepo.findById.mockResolvedValue(makeTransfer());

      const result = await service.getTransfer({ id: transferId }, { id: userId });

      expect(result.id).toBe(transferId);
      expect(cache.setJson).toHaveBeenCalled();
    });

    it("throws NotFoundError for transfer owned by another user", async () => {
      transferRepo.findById.mockResolvedValue(makeTransfer({ userId: otherUserId }));

      await expect(service.getTransfer({ id: transferId }, { id: userId })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("updateTransfer", () => {
    it("re-validates effective refs before update", async () => {
      transferRepo.findById.mockResolvedValue(makeTransfer());
      accountRepo.findByIdWithCurrency
        .mockResolvedValueOnce(makeAccountWithCurrency(fromAccountId) as never)
        .mockResolvedValueOnce(makeAccountWithCurrency(toAccountId) as never);
      transferRepo.update.mockResolvedValue(makeTransfer({ amount: 200 as never }));

      await service.updateTransfer({ amount: 200 }, { id: transferId }, { id: userId });

      expect(accountRepo.findByIdWithCurrency).toHaveBeenCalledTimes(2);
      expect(transferRepo.update).toHaveBeenCalled();
    });
  });

  describe("getTransfers", () => {
    it("returns cached list", async () => {
      const cached = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getTransfers({ page: 1, limit: 20 }, { id: userId });

      expect(result).toBe(cached);
    });
  });

  describe("getTransfersByAccountId", () => {
    it("returns cached list scoped by account", async () => {
      const cached = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getTransfersByAccountId(
        { id: fromAccountId },
        { page: 1, limit: 20 },
        { id: userId },
      );

      expect(result).toBe(cached);
    });

    it("uses findByFilter with accountId instead of findByAccountId", async () => {
      transferRepo.findByFilter.mockResolvedValue({
        data: [makeTransfer()],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      await service.getTransfersByAccountId(
        { id: fromAccountId },
        { page: 1, limit: 20 },
        { id: userId },
      );

      expect(transferRepo.findByFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          accountId: fromAccountId,
        }),
        { page: 1, limit: 20 },
        undefined,
      );
      expect(transferRepo.findByAccountId).not.toHaveBeenCalled();
    });
  });

  describe("getTransfersByUserId", () => {
    it("delegates to getTransfers", async () => {
      transferRepo.findByFilter.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.getTransfersByUserId({ page: 1, limit: 20 }, { id: userId });

      expect(transferRepo.findByFilter).toHaveBeenCalled();
    });
  });
});
