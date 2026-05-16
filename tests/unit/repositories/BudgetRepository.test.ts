jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    budget: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { BudgetRepository } from "../../../src/repositories/impl/BudgetRepository";
import { AbortError } from "../../../src/utils/errors/СlientErrors";

describe("BudgetRepository", () => {
  let repo: BudgetRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new BudgetRepository();
  });

  describe("коректність", () => {
    it("findByUserId: включає category та currency для зручності", async () => {
      (prisma.budget.findMany as jest.Mock).mockResolvedValue([]);

      await repo.findByUserId("u1");

      expect(prisma.budget.findMany).toHaveBeenCalledWith({
        where: { userId: "u1", isDeleted: false },
        include: { category: true, currency: true },
      });
    });

    it("findActiveByPeriod: використовує lte/gte для дат", async () => {
      const testDate = new Date("2024-01-15");
      (prisma.budget.findMany as jest.Mock).mockResolvedValue([]);

      await repo.findActiveByPeriod("u1", testDate);

      expect(prisma.budget.findMany).toHaveBeenCalledWith({
        where: {
          userId: "u1",
          isDeleted: false,
          periodStart: { lte: testDate },
          periodEnd: { gte: testDate },
        },
      });
    });

    it("upsert коректно передає Decimal дані", async () => {
      const params = {
        where: { id: "b1" },
        create: {
          userId: "u1",
          accountId: "a1",
          currencyId: "c1",
          name: "Test Budget",
          periodStart: new Date(),
          periodEnd: new Date(),
          limitAmount: 1000,
        },
        update: { limitAmount: 1200 },
      };

      (prisma.budget.upsert as jest.Mock).mockResolvedValue({ id: "b1" });

      await repo.upsert(params);
      expect(prisma.budget.upsert).toHaveBeenCalledWith(params);
    });
  });

  describe("стійкість до зловмисних / крайніх вхідних даних", () => {
    it("викидає AbortError при скасуванні запиту", async () => {
      const ac = new AbortController();
      ac.abort();

      // Ensure the mock is set so the code doesn't crash before checking the signal
      (prisma.budget.findMany as jest.Mock).mockResolvedValue([]);

      await expect(repo.findByUserId("u1", { signal: ac.signal })).rejects.toThrow(AbortError);
    });
  });
});
