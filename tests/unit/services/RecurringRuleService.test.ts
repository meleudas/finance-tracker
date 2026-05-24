import { RecurringRuleService } from "../../../src/services/impl/RecurringRuleService";
import type { IRecurringRuleRepository } from "../../../src/repositories/interfaces/IRecurringRuleRepository";
import type { IRecurringFrequencyRepository } from "../../../src/repositories/interfaces/IRecurringFrequencyRepository";
import type { IAccountRepository } from "../../../src/repositories/interfaces/IAccountRepository";
import type { ICategoryRepository } from "../../../src/repositories/interfaces/ICategoryRepository";
import type { ICache } from "../../../src/redis";
import { NotFoundError, ValidationError } from "../../../src/utils/errors/ClientErrors";
import type { RecurringRuleWithFrequency } from "../../../src/repositories/interfaces/IRecurringRuleRepository";

describe("RecurringRuleService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const accountId = "clk7v9x1k0000qzq8x8x8x8xb";
  const currencyId = "clm7v9x1k0000qzq8x8x8x8xc";
  const frequencyId = "cln7v9x1k0000qzq8x8x8x8x1";
  const ruleId = "clo7v9x1k0000qzq8x8x8x8x3";

  let ruleRepo: jest.Mocked<IRecurringRuleRepository>;
  let frequencyRepo: jest.Mocked<IRecurringFrequencyRepository>;
  let accountRepo: jest.Mocked<IAccountRepository>;
  let categoryRepo: jest.Mocked<ICategoryRepository>;
  let cache: jest.Mocked<ICache>;
  let service: RecurringRuleService;

  const frequency = {
    id: frequencyId,
    userId,
    name: "Weekly",
    every: 1,
    unit: "WEEK" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    isDeleted: false,
  };

  const makeRule = (): RecurringRuleWithFrequency => ({
    id: ruleId,
    userId,
    accountId,
    currencyId,
    categoryId: null,
    frequencyId,
    name: "Rent",
    amount: 500 as unknown as RecurringRuleWithFrequency["amount"],
    direction: "EXPENSE",
    nextRunAt: new Date("2026-06-01T00:00:00.000Z"),
    endsAt: null,
    maxOccurrences: null,
    occurrenceCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    isDeleted: false,
    frequency,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    ruleRepo = {
      findByIdForUser: jest.fn(),
      findByFilter: jest.fn(),
      findDueRules: jest.fn(),
      updateSchedule: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findMany: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<IRecurringRuleRepository>;

    frequencyRepo = {
      findByIdForUser: jest.fn().mockResolvedValue(frequency),
    } as unknown as jest.Mocked<IRecurringFrequencyRepository>;

    accountRepo = {
      findByIdWithCurrency: jest.fn().mockResolvedValue({
        id: accountId,
        userId,
        currencyId,
        name: "Main",
        isDeleted: false,
        currency: { id: currencyId, code: "UAH" },
      }),
    } as unknown as jest.Mocked<IAccountRepository>;

    categoryRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ICategoryRepository>;

    cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ICache>;

    service = new RecurringRuleService(ruleRepo, frequencyRepo, accountRepo, categoryRepo, cache);
  });

  it("створює rule з nextRunAt за замовчуванням (now)", async () => {
    const created = makeRule();
    ruleRepo.create.mockResolvedValue(created);
    ruleRepo.findByIdForUser.mockResolvedValue(created);

    const before = Date.now();
    await service.create(userId, {
      name: "Rent",
      accountId,
      currencyId,
      frequencyId,
      amount: 500,
      direction: "EXPENSE",
    });
    const after = Date.now();

    const createArg = ruleRepo.create.mock.calls[0]?.[0] as { nextRunAt: Date };
    expect(createArg.nextRunAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(createArg.nextRunAt.getTime()).toBeLessThanOrEqual(after);
  });

  it("кидає ValidationError при невідповідній валюті", async () => {
    await expect(
      service.create(userId, {
        name: "Rent",
        accountId,
        currencyId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        frequencyId,
        amount: 500,
        direction: "EXPENSE",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("list завантажує з репозиторію при cache miss", async () => {
    ruleRepo.findByFilter.mockResolvedValue({
      data: [makeRule()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const result = await service.list(userId, { page: 1, limit: 20 });

    expect(result.data).toHaveLength(1);
    expect(cache.setJson).toHaveBeenCalled();
  });

  it("getById завантажує з репозиторію при cache miss", async () => {
    ruleRepo.findByIdForUser.mockResolvedValue(makeRule());

    await service.getById(userId, ruleId);

    expect(cache.setJson).toHaveBeenCalled();
  });

  it("list повертає з кешу", async () => {
    const cached = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    cache.getJson.mockResolvedValueOnce(cached);

    const result = await service.list(userId, { page: 1, limit: 20 });

    expect(result).toBe(cached);
    expect(ruleRepo.findByFilter).not.toHaveBeenCalled();
  });

  it("getById повертає з кешу", async () => {
    const cached = { id: ruleId, name: "Rent" };
    cache.getJson.mockResolvedValueOnce(cached);

    const result = await service.getById(userId, ruleId);

    expect(result).toEqual(cached);
  });

  it("getById кидає NotFoundError", async () => {
    ruleRepo.findByIdForUser.mockResolvedValue(null);

    await expect(service.getById(userId, ruleId)).rejects.toThrow(NotFoundError);
  });

  it("create з nextRunAt та endsAt", async () => {
    const created = makeRule();
    ruleRepo.create.mockResolvedValue(created);
    ruleRepo.findByIdForUser.mockResolvedValue(created);

    await service.create(userId, {
      name: "Rent",
      accountId,
      currencyId,
      frequencyId,
      amount: 500,
      direction: "EXPENSE",
      nextRunAt: "2026-06-01T00:00:00.000Z",
      endsAt: "2027-01-01T00:00:00.000Z",
    });

    expect(ruleRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nextRunAt: expect.any(Date),
        endsAt: expect.any(Date),
      }),
      undefined,
    );
  });

  it("update кидає ValidationError коли endsAt <= nextRunAt", async () => {
    ruleRepo.findByIdForUser.mockResolvedValue(makeRule());

    await expect(
      service.update(userId, ruleId, {
        nextRunAt: "2026-12-01T00:00:00.000Z",
        endsAt: "2026-06-01T00:00:00.000Z",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("update оновлює rule", async () => {
    const existing = makeRule();
    ruleRepo.findByIdForUser.mockResolvedValue(existing);
    ruleRepo.update.mockResolvedValue(existing);

    const updated = { ...makeRule(), name: "Updated rent" };
    ruleRepo.findByIdForUser.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

    const result = await service.update(userId, ruleId, { name: "Updated rent" });

    expect(result.name).toBe("Updated rent");
    expect(cache.keys).toHaveBeenCalled();
  });

  it("remove soft-deletes rule", async () => {
    ruleRepo.findByIdForUser.mockResolvedValue(makeRule());
    ruleRepo.softDelete.mockResolvedValue({
      id: ruleId,
      isDeleted: true,
      deletedAt: new Date(),
    } as never);

    const result = await service.remove(userId, ruleId);

    expect(result.isDeleted).toBe(true);
  });

  it("кидає NotFoundError для category", async () => {
    categoryRepo.findById.mockResolvedValue(null);

    await expect(
      service.create(userId, {
        name: "Rent",
        accountId,
        currencyId,
        frequencyId,
        categoryId: "clcat00000000000000000001",
        amount: 500,
        direction: "EXPENSE",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("кидає ValidationError для category kind mismatch", async () => {
    categoryRepo.findById.mockResolvedValue({
      id: "clcat00000000000000000001",
      userId,
      kind: "INCOME",
      isDeleted: false,
    } as never);

    await expect(
      service.create(userId, {
        name: "Rent",
        accountId,
        currencyId,
        frequencyId,
        categoryId: "clcat00000000000000000001",
        amount: 500,
        direction: "EXPENSE",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("кидає NotFoundError для чужого frequency", async () => {
    frequencyRepo.findByIdForUser.mockResolvedValue(null);

    await expect(
      service.create(userId, {
        name: "Rent",
        accountId,
        currencyId,
        frequencyId,
        amount: 500,
        direction: "EXPENSE",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
