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
