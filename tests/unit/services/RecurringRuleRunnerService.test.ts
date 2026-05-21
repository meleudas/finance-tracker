jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    $transaction: jest.fn(),
    transaction: { create: jest.fn() },
    recurringRule: { update: jest.fn() },
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { RecurringRuleRunnerService } from "../../../src/services/impl/RecurringRuleRunnerService";
import type { IRecurringRuleRepository } from "../../../src/repositories/interfaces/IRecurringRuleRepository";
import type { IAccountRepository } from "../../../src/repositories/interfaces/IAccountRepository";
import type { ICache } from "../../../src/redis";
import type { RecurringRuleWithFrequency } from "../../../src/repositories/interfaces/IRecurringRuleRepository";

describe("RecurringRuleRunnerService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const accountId = "clk7v9x1k0000qzq8x8x8x8xb";
  const currencyId = "clm7v9x1k0000qzq8x8x8x8xc";
  const frequencyId = "cln7v9x1k0000qzq8x8x8x8x1";
  const ruleId = "clo7v9x1k0000qzq8x8x8x8x3";

  let ruleRepo: jest.Mocked<IRecurringRuleRepository>;
  let accountRepo: jest.Mocked<IAccountRepository>;
  let cache: jest.Mocked<ICache>;
  let service: RecurringRuleRunnerService;

  const dueRule = (): RecurringRuleWithFrequency => ({
    id: ruleId,
    userId,
    accountId,
    currencyId,
    categoryId: null,
    frequencyId,
    name: "Rent",
    amount: 100 as unknown as RecurringRuleWithFrequency["amount"],
    direction: "EXPENSE",
    nextRunAt: new Date("2026-05-01T00:00:00.000Z"),
    endsAt: null,
    maxOccurrences: 2,
    occurrenceCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    isDeleted: false,
    frequency: {
      id: frequencyId,
      userId,
      name: "Monthly",
      every: 1,
      unit: "MONTH",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      isDeleted: false,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    ruleRepo = {
      findDueRules: jest.fn(),
      updateSchedule: jest.fn(),
    } as unknown as jest.Mocked<IRecurringRuleRepository>;

    accountRepo = {
      findByIdWithCurrency: jest.fn().mockResolvedValue({
        id: accountId,
        userId,
        currencyId,
        isDeleted: false,
      }),
    } as unknown as jest.Mocked<IAccountRepository>;

    cache = {
      keys: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ICache>;

    (prisma.$transaction as jest.Mock).mockImplementation(async (ops: unknown[]) => {
      for (const op of ops) {
        if (typeof op === "function") {
          await (op as () => Promise<unknown>)();
        }
      }
    });

    service = new RecurringRuleRunnerService(ruleRepo, accountRepo, cache);
  });

  it("materialize due rule і оновлює nextRunAt", async () => {
    ruleRepo.findDueRules.mockResolvedValue([dueRule()]);

    const result = await service.processDueRules();

    expect(result.processed).toBe(1);
    expect(result.created).toBe(1);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("зупиняється на maxOccurrences", async () => {
    const rule = dueRule();
    rule.occurrenceCount = 2;
    rule.maxOccurrences = 2;
    ruleRepo.findDueRules.mockResolvedValue([rule]);

    const result = await service.processDueRules();

    expect(result.created).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
