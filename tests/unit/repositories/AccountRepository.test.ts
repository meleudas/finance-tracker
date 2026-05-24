jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    account: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { AccountRepository } from "../../../src/repositories/impl/AccountRepository";

describe("AccountRepository", () => {
  let repo: AccountRepository;
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const accountId = "clk7v9x1k0000qzq8x8x8x8xb";

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new AccountRepository();
  });

  describe("CRUD", () => {
    it("create/update/softDelete/findById", async () => {
      (prisma.account.create as jest.Mock).mockResolvedValue({ id: accountId });
      (prisma.account.update as jest.Mock).mockResolvedValue({ id: accountId, name: "New" });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: accountId });

      await repo.create({
        userId,
        name: "Cash",
        currencyId: "clm7v9x1k0000qzq8x8x8x8xc",
        balance: 0,
        deletedAt: null,
      } as never);
      await repo.update(accountId, { name: "New" });
      await repo.softDelete(accountId);
      await repo.findById(accountId);

      expect(prisma.account.create).toHaveBeenCalled();
      expect(prisma.account.update).toHaveBeenCalledTimes(2);
      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId, isDeleted: false },
      });
    });
  });

  describe("findByUserId", () => {
    it("повертає пагінований результат", async () => {
      (prisma.account.findMany as jest.Mock).mockResolvedValue([{ id: accountId }]);
      (prisma.account.count as jest.Mock).mockResolvedValue(1);

      const result = await repo.findByUserId(userId, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("findByIdWithCurrency", () => {
    it("findFirst з id, userId та isDeleted: false", async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);

      await repo.findByIdWithCurrency(accountId, userId);

      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId, userId, isDeleted: false },
        include: { currency: true },
      });
    });
  });

  describe("findByFilter", () => {
    it("за замовчуванням фільтрує isDeleted: false", async () => {
      (prisma.account.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.account.count as jest.Mock).mockResolvedValue(0);

      await repo.findByFilter({ userId, isDeleted: false }, { page: 1, limit: 20 });

      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, isDeleted: false },
        }),
      );
    });

    it("додає currencyId до where", async () => {
      (prisma.account.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.account.count as jest.Mock).mockResolvedValue(0);

      await repo.findByFilter(
        { userId, currencyId: "clm7v9x1k0000qzq8x8x8x8xc" },
        { page: 1, limit: 20 },
      );

      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, currencyId: "clm7v9x1k0000qzq8x8x8x8xc" },
        }),
      );
    });

    it("без isDeleted у фільтрі не додає поле до where", async () => {
      (prisma.account.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.account.count as jest.Mock).mockResolvedValue(0);

      await repo.findByFilter({ userId }, { page: 1, limit: 20 });

      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        }),
      );
    });
  });

  describe("hasActiveDependencies", () => {
    it("повертає true якщо є активні транзакції", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        _count: {
          transactions: 1,
          budgets: 0,
          recurringRules: 0,
          transfersFrom: 0,
          transfersTo: 0,
        },
      });

      const result = await repo.hasActiveDependencies(accountId);

      expect(result).toBe(true);
    });

    it("повертає false якщо залежностей немає", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        _count: {
          transactions: 0,
          budgets: 0,
          recurringRules: 0,
          transfersFrom: 0,
          transfersTo: 0,
        },
      });

      const result = await repo.hasActiveDependencies(accountId);

      expect(result).toBe(false);
    });

    it("повертає false якщо рахунок не знайдено", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.hasActiveDependencies(accountId);

      expect(result).toBe(false);
    });
  });
});
