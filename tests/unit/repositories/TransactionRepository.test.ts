jest.mock("../../../src/config/prismaClient");

import { prisma } from "../../../src/config/prismaClient";
import { TransactionRepository } from "../../../src/repositories/impl/TransactionRepository";
import { AbortError } from "../../../src/utils/errors/ClientErrors";

describe("TransactionRepository", () => {
  let repo: TransactionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new TransactionRepository();
  });

  describe("коректність", () => {
    it("findByUserId: where та пагінація", async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transaction.count as jest.Mock).mockResolvedValue(3);

      await repo.findByUserId("user-2", { page: 1, limit: 25 });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: "user-2", isDeleted: false },
        skip: 0,
        take: 25,
        orderBy: { occurredAt: "desc" },
      });
    });

    it("findByFilter: accountId, categoryId, direction та діапазон дат", async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transaction.count as jest.Mock).mockResolvedValue(0);
      const from = new Date("2026-01-01T00:00:00.000Z");
      const to = new Date("2026-01-31T00:00:00.000Z");

      await repo.findByFilter(
        {
          userId: "u1",
          accountId: "acc-1",
          categoryId: "cat-1",
          direction: "INCOME",
          from,
          to,
        },
        { page: 1, limit: 10 },
      );

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "u1",
            isDeleted: false,
            accountId: "acc-1",
            categoryId: "cat-1",
            direction: "INCOME",
            occurredAt: { gte: from, lte: to },
          },
        }),
      );
    });

    it("sumAmount: aggregate з direction та currencyId", async () => {
      (prisma.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: { toNumber: () => 150 } },
      });
      const from = new Date("2026-05-01T00:00:00.000Z");
      const to = new Date("2026-05-31T00:00:00.000Z");

      const total = await repo.sumAmount({ userId: "u1", currencyId: "cur-1", from, to }, "INCOME");

      expect(prisma.transaction.aggregate).toHaveBeenCalledWith({
        where: {
          userId: "u1",
          isDeleted: false,
          currencyId: "cur-1",
          direction: "INCOME",
          occurredAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      });
      expect(total).toBe(150);
    });

    it("sumByCategory: groupBy categoryId та direction", async () => {
      (prisma.transaction.groupBy as jest.Mock).mockResolvedValue([
        {
          categoryId: "cat-1",
          direction: "EXPENSE",
          _sum: { amount: { toNumber: () => 80 } },
          _count: { _all: 3 },
        },
      ]);

      const rows = await repo.sumByCategory({
        userId: "u1",
        from: new Date("2026-05-01"),
        to: new Date("2026-05-31"),
      });

      expect(prisma.transaction.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ["categoryId", "direction"],
          _sum: { amount: true },
          _count: { _all: true },
        }),
      );
      expect(rows).toEqual([
        { categoryId: "cat-1", direction: "EXPENSE", amount: 80, transactionCount: 3 },
      ]);
    });

    it("sumByAccount: groupBy accountId та direction", async () => {
      (prisma.transaction.groupBy as jest.Mock).mockResolvedValue([
        {
          accountId: "acc-1",
          direction: "INCOME",
          _sum: { amount: { toNumber: () => 200 } },
        },
      ]);

      const rows = await repo.sumByAccount({ userId: "u1" });

      expect(prisma.transaction.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ["accountId", "direction"],
        }),
      );
      expect(rows).toEqual([{ accountId: "acc-1", direction: "INCOME", amount: 200 }]);
    });

    it("findByFilter: лише from без to", async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transaction.count as jest.Mock).mockResolvedValue(0);
      const from = new Date("2026-05-01T00:00:00.000Z");

      await repo.findByFilter({ userId: "u1", from }, { page: 1, limit: 10 });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            occurredAt: { gte: from },
          }),
        }),
      );
    });

    it("findByCategoryId: фільтр за категорією", async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      await repo.findByCategoryId("cat-z");
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { categoryId: "cat-z", isDeleted: false },
        orderBy: { occurredAt: "desc" },
      });
    });

    it("sumExpenseAmount делегує до sumAmount EXPENSE", async () => {
      (prisma.transaction.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 10 } });
      const total = await repo.sumExpenseAmount({ userId: "u1" });
      expect(total).toBe(10);
      expect(prisma.transaction.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ direction: "EXPENSE" }) }),
      );
    });

    it("sumByRecurringRule: фільтрує null recurringRuleId", async () => {
      (prisma.transaction.groupBy as jest.Mock).mockResolvedValue([
        {
          recurringRuleId: "rule-1",
          _sum: { amount: 50 },
          _count: { _all: 2 },
        },
        { recurringRuleId: null, _sum: { amount: 0 }, _count: { _all: 0 } },
      ]);

      const rows = await repo.sumByRecurringRule({ userId: "u1" });

      expect(rows).toEqual([{ recurringRuleId: "rule-1", amount: 50, transactionCount: 2 }]);
    });

    it("findByAccountId: фільтр за рахунком та isDeleted", async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      await repo.findByAccountId("acc-z");

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { accountId: "acc-z", isDeleted: false },
        orderBy: { occurredAt: "desc" },
      });
    });
  });

  describe("стійкість до зловмисних / крайніх вхідних даних", () => {
    it("findByUserId: limit обрізається до 100", async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transaction.count as jest.Mock).mockResolvedValue(0);

      await repo.findByUserId("u", { page: 1, limit: 500 });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it("findByFilter: categoryId з підозрілим вмістом передається як рівність", async () => {
      const weird = '\'; DELETE FROM "Transaction";--';
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transaction.count as jest.Mock).mockResolvedValue(0);

      await repo.findByFilter({ userId: "u", categoryId: weird }, { page: 1, limit: 10 });

      expect(prisma.transaction.findMany).toHaveBeenCalled();
      const findMany = prisma.transaction.findMany as jest.MockedFunction<
        (args: { where: Record<string, unknown> }) => Promise<unknown>
      >;
      const firstArg = findMany.mock.calls[0]?.[0];
      expect(firstArg?.where).toMatchObject({
        userId: "u",
        isDeleted: false,
        categoryId: weird,
      });
    });

    it("findByAccountId з перерваним signal — AbortError (findMany встигає викликатися)", async () => {
      const ac = new AbortController();
      ac.abort();
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      await expect(repo.findByAccountId("acc", { signal: ac.signal })).rejects.toThrow(AbortError);
      expect(prisma.transaction.findMany).toHaveBeenCalled();
    });
  });
});
