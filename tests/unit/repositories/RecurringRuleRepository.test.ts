jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    recurringRule: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { RecurringRuleRepository } from "../../../src/repositories/impl/RecurringRuleRepository";
import { RECURRING_RULE_EXHAUSTED_NEXT_RUN } from "../../../src/utils/helpers/recurringSchedule";
import { AbortError } from "../../../src/utils/errors/ClientErrors";

describe("RecurringRuleRepository", () => {
  let repo: RecurringRuleRepository;
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const ruleId = "clk7v9x1k0000qzq8x8x8x8xb";

  const ruleBase = {
    id: ruleId,
    userId,
    isDeleted: false,
    occurrenceCount: 0,
    maxOccurrences: null as number | null,
    endsAt: null as Date | null,
    nextRunAt: new Date("2026-05-01T00:00:00.000Z"),
    frequency: { every: 1, unit: "MONTH" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new RecurringRuleRepository();
  });

  describe("findByIdForUser", () => {
    it("шукає за id, userId та isDeleted: false", async () => {
      (prisma.recurringRule.findFirst as jest.Mock).mockResolvedValue(null);

      await repo.findByIdForUser(ruleId, userId);

      expect(prisma.recurringRule.findFirst).toHaveBeenCalledWith({
        where: { id: ruleId, userId, isDeleted: false },
        include: { frequency: true },
      });
    });
  });

  describe("findByFilter", () => {
    it("будує where з опційними фільтрами та пагінацією", async () => {
      (prisma.recurringRule.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.recurringRule.count as jest.Mock).mockResolvedValue(0);

      const result = await repo.findByFilter(
        {
          userId,
          accountId: "clm7v9x1k0000qzq8x8x8x8xc",
          frequencyId: "cln7v9x1k0000qzq8x8x8x8x1",
          direction: "EXPENSE",
        },
        { page: 2, limit: 10 },
      );

      expect(prisma.recurringRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            isDeleted: false,
            accountId: "clm7v9x1k0000qzq8x8x8x8xc",
            frequencyId: "cln7v9x1k0000qzq8x8x8x8x1",
            direction: "EXPENSE",
          },
          skip: 10,
          take: 10,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it("обрізає limit до 100", async () => {
      (prisma.recurringRule.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.recurringRule.count as jest.Mock).mockResolvedValue(0);

      await repo.findByFilter({ userId }, { page: 1, limit: 500 });

      expect(prisma.recurringRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  describe("findDueRules", () => {
    it("фільтрує вичерпані правила за maxOccurrences та endsAt", async () => {
      const asOf = new Date("2026-06-01T00:00:00.000Z");
      (prisma.recurringRule.findMany as jest.Mock).mockResolvedValue([
        { ...ruleBase, maxOccurrences: 1, occurrenceCount: 1 },
        {
          ...ruleBase,
          id: "clp7v9x1k0000qzq8x8x8x8x2",
          endsAt: new Date("2026-04-01T00:00:00.000Z"),
          nextRunAt: new Date("2026-05-15T00:00:00.000Z"),
        },
        { ...ruleBase, id: "clq7v9x1k0000qzq8x8x8x8x3" },
      ]);

      const result = await repo.findDueRules(asOf, 2);

      expect(prisma.recurringRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isDeleted: false,
            nextRunAt: { lte: asOf, lt: RECURRING_RULE_EXHAUSTED_NEXT_RUN },
          },
          take: 4,
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("clq7v9x1k0000qzq8x8x8x8x3");
    });
  });

  describe("findIntersectingPeriod", () => {
    it("шукає правила, що перетинають період", async () => {
      const periodStart = new Date("2026-05-01T00:00:00.000Z");
      const periodEnd = new Date("2026-05-31T23:59:59.999Z");
      (prisma.recurringRule.findMany as jest.Mock).mockResolvedValue([]);

      await repo.findIntersectingPeriod(
        userId,
        periodStart,
        periodEnd,
        "clm7v9x1k0000qzq8x8x8x8xc",
      );

      expect(prisma.recurringRule.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isDeleted: false,
          accountId: "clm7v9x1k0000qzq8x8x8x8xc",
          OR: [{ endsAt: null }, { endsAt: { gte: periodStart } }],
        },
        include: { frequency: true },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("updateSchedule", () => {
    it("оновлює nextRunAt та occurrenceCount", async () => {
      const nextRunAt = new Date("2026-06-01T00:00:00.000Z");
      (prisma.recurringRule.update as jest.Mock).mockResolvedValue({ id: ruleId });

      await repo.updateSchedule(ruleId, { nextRunAt, occurrenceCount: 3 });

      expect(prisma.recurringRule.update).toHaveBeenCalledWith({
        where: { id: ruleId },
        data: { nextRunAt, occurrenceCount: 3 },
      });
    });

    it("кидає AbortError при перерваному signal", async () => {
      const ac = new AbortController();
      ac.abort();

      await expect(
        repo.updateSchedule(
          ruleId,
          { nextRunAt: new Date(), occurrenceCount: 0 },
          { signal: ac.signal },
        ),
      ).rejects.toThrow(AbortError);
    });
  });
});
