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
