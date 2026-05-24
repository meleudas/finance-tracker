jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    recurringFrequency: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    recurringRule: {
      count: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { RecurringFrequencyRepository } from "../../../src/repositories/impl/RecurringFrequencyRepository";
import { AbortError } from "../../../src/utils/errors/ClientErrors";

describe("RecurringFrequencyRepository", () => {
  let repo: RecurringFrequencyRepository;
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const frequencyId = "clk7v9x1k0000qzq8x8x8x8xb";

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new RecurringFrequencyRepository();
  });

  describe("findByIdForUser", () => {
    it("шукає за id, userId та isDeleted: false", async () => {
      (prisma.recurringFrequency.findFirst as jest.Mock).mockResolvedValue(null);

      await repo.findByIdForUser(frequencyId, userId);

      expect(prisma.recurringFrequency.findFirst).toHaveBeenCalledWith({
        where: { id: frequencyId, userId, isDeleted: false },
      });
    });
  });

  describe("findByFilter", () => {
    it("фільтрує за name (insensitive) та пагінує", async () => {
      (prisma.recurringFrequency.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.recurringFrequency.count as jest.Mock).mockResolvedValue(25);

      const result = await repo.findByFilter({ userId, name: "month" }, { page: 2, limit: 10 });

      expect(prisma.recurringFrequency.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            isDeleted: false,
            name: { contains: "month", mode: "insensitive" },
          },
          skip: 10,
          take: 10,
          orderBy: { name: "asc" },
        }),
      );
      expect(result.totalPages).toBe(3);
    });

    it("нормалізує від'ємну сторінку", async () => {
      (prisma.recurringFrequency.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.recurringFrequency.count as jest.Mock).mockResolvedValue(0);

      await repo.findByFilter({ userId }, { page: -1, limit: 10 });

      expect(prisma.recurringFrequency.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 }),
      );
    });
  });

  describe("countActiveRules", () => {
    it("рахує активні правила для frequencyId", async () => {
      (prisma.recurringRule.count as jest.Mock).mockResolvedValue(4);

      const count = await repo.countActiveRules(frequencyId);

      expect(count).toBe(4);
      expect(prisma.recurringRule.count).toHaveBeenCalledWith({
        where: { frequencyId, isDeleted: false },
      });
    });

    it("кидає AbortError при перерваному signal", async () => {
      const ac = new AbortController();
      ac.abort();

      await expect(repo.countActiveRules(frequencyId, { signal: ac.signal })).rejects.toThrow(
        AbortError,
      );
    });
  });
});
