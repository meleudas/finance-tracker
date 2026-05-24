jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    budget: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { BudgetRepository } from "../../../src/repositories/impl/BudgetRepository";
import { AbortError } from "../../../src/utils/errors/ClientErrors";

describe("BudgetRepository", () => {
  let repo: BudgetRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new BudgetRepository();
  });

  describe("коректність", () => {
    it("findByUserId: включає category та currency", async () => {
      (prisma.budget.findMany as jest.Mock).mockResolvedValue([]);

      await repo.findByUserId("u1");

      expect(prisma.budget.findMany).toHaveBeenCalledWith({
        where: { userId: "u1", isDeleted: false },
        include: { category: true, currency: true },
      });
    });

    it("findActiveByDateRange: використовує lte/gte для дат", async () => {
      const testDate = new Date("2024-01-15");
      (prisma.budget.findMany as jest.Mock).mockResolvedValue([]);

      await repo.findActiveByDateRange("u1", testDate);

      expect(prisma.budget.findMany).toHaveBeenCalledWith({
        where: {
          userId: "u1",
          isDeleted: false,
          periodStart: { lte: testDate },
          periodEnd: { gte: testDate },
        },
      });
    });

    it("findOverlapping: перевіряє перетин періодів", async () => {
      (prisma.budget.findFirst as jest.Mock).mockResolvedValue(null);
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");

      await repo.findOverlapping("u1", "acc1", null, start, end);

      expect(prisma.budget.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "u1",
          accountId: "acc1",
          categoryId: null,
          isDeleted: false,
          periodStart: { lt: end },
          periodEnd: { gt: start },
        },
      });
    });

    it("findActiveById: фільтрує userId та isDeleted", async () => {
      (prisma.budget.findFirst as jest.Mock).mockResolvedValue({ id: "b1" });

      await repo.findActiveById("b1", "u1");

      expect(prisma.budget.findFirst).toHaveBeenCalledWith({
        where: { id: "b1", userId: "u1", isDeleted: false },
      });
    });

    it("findOverlapping: excludeId додається до where", async () => {
      (prisma.budget.findFirst as jest.Mock).mockResolvedValue(null);
      await repo.findOverlapping("u1", "acc1", null, new Date(), new Date(), "exclude-me");
      expect(prisma.budget.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { not: "exclude-me" } }),
        }),
      );
    });

    it("findIntersectingPeriod: з accountId", async () => {
      (prisma.budget.findMany as jest.Mock).mockResolvedValue([]);
      await repo.findIntersectingPeriod(
        "u1",
        new Date("2026-01-01"),
        new Date("2026-12-31"),
        "acc1",
      );
      expect(prisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ accountId: "acc1" }) }),
      );
    });

    it("updateLimit оновлює limitAmount", async () => {
      const { Decimal } = await import("@prisma/client/runtime/client");
      (prisma.budget.update as jest.Mock).mockResolvedValue({ id: "b1" });
      await repo.updateLimit("b1", new Decimal(500));
      expect(prisma.budget.update).toHaveBeenCalled();
    });

    it("findByFilter: activeNow та period bounds", async () => {
      (prisma.budget.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.budget.count as jest.Mock).mockResolvedValue(0);
      await repo.findByFilter(
        {
          userId: "u1",
          activeNow: true,
          from: new Date("2026-01-01"),
          to: new Date("2026-12-31"),
          categoryId: "cat1",
        },
        { page: 1, limit: 20 },
      );
      expect(prisma.budget.findMany).toHaveBeenCalled();
    });

    it("findByFilter: пагінація та фільтр accountId", async () => {
      (prisma.budget.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.budget.count as jest.Mock).mockResolvedValue(0);

      await repo.findByFilter({ userId: "u1", accountId: "acc1" }, { page: 1, limit: 20 });

      expect(prisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: "u1", accountId: "acc1" }),
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  describe("стійкість", () => {
    it("викидає AbortError при скасуванні запиту", async () => {
      const ac = new AbortController();
      ac.abort();
      (prisma.budget.findMany as jest.Mock).mockResolvedValue([]);

      await expect(repo.findByUserId("u1", { signal: ac.signal })).rejects.toThrow(AbortError);
    });
  });
});
