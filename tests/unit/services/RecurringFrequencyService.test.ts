import { RecurringFrequencyService } from "../../../src/services/impl/RecurringFrequencyService";
import type { IRecurringFrequencyRepository } from "../../../src/repositories/interfaces/IRecurringFrequencyRepository";
import type { ICache } from "../../../src/redis";
import { ConflictError, NotFoundError } from "../../../src/utils/errors/ClientErrors";
import type { RecurringFrequency } from "../../../src/generated/prisma/client";

describe("RecurringFrequencyService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const frequencyId = "clm7v9x1k0000qzq8x8x8x8xc";

  let frequencyRepo: jest.Mocked<IRecurringFrequencyRepository>;
  let cache: jest.Mocked<ICache>;
  let service: RecurringFrequencyService;

  const sample: RecurringFrequency = {
    id: frequencyId,
    userId,
    name: "Monthly",
    every: 1,
    unit: "MONTH",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    isDeleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    frequencyRepo = {
      findByIdForUser: jest.fn(),
      findByFilter: jest.fn(),
      countActiveRules: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findMany: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<IRecurringFrequencyRepository>;

    cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ICache>;

    service = new RecurringFrequencyService(frequencyRepo, cache);
  });

  it("створює frequency", async () => {
    frequencyRepo.create.mockResolvedValue(sample);

    const result = await service.create(userId, {
      name: "Monthly",
      every: 1,
      unit: "MONTH",
    });

    expect(result.name).toBe("Monthly");
    expect(frequencyRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId, name: "Monthly", every: 1, unit: "MONTH" }),
      undefined,
    );
  });

  it("кидає ConflictError при видаленні з активними rules", async () => {
    frequencyRepo.findByIdForUser.mockResolvedValue(sample);
    frequencyRepo.countActiveRules.mockResolvedValue(2);

    await expect(service.remove(userId, frequencyId)).rejects.toThrow(ConflictError);
  });

  it("list завантажує з репозиторію при cache miss", async () => {
    frequencyRepo.findByFilter.mockResolvedValue({
      data: [sample],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const result = await service.list(userId, { page: 1, limit: 20 });

    expect(result.data).toHaveLength(1);
    expect(cache.setJson).toHaveBeenCalled();
  });

  it("list повертає з кешу", async () => {
    const cached = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    cache.getJson.mockResolvedValueOnce(cached);

    const result = await service.list(userId, { page: 1, limit: 20 });

    expect(result).toBe(cached);
  });

  it("getById повертає з кешу", async () => {
    cache.getJson.mockResolvedValueOnce({ id: frequencyId, name: "Monthly" });

    const result = await service.getById(userId, frequencyId);

    expect(result.name).toBe("Monthly");
    expect(frequencyRepo.findByIdForUser).not.toHaveBeenCalled();
  });

  it("create кидає ConflictError при unique violation", async () => {
    frequencyRepo.create.mockRejectedValue({ code: "P2002" });

    await expect(
      service.create(userId, { name: "Monthly", every: 1, unit: "MONTH" }),
    ).rejects.toThrow(ConflictError);
  });

  it("update оновлює frequency", async () => {
    frequencyRepo.findByIdForUser.mockResolvedValue(sample);
    frequencyRepo.update.mockResolvedValue({ ...sample, name: "Weekly" });

    const result = await service.update(userId, frequencyId, { name: "Weekly" });

    expect(result.name).toBe("Weekly");
    expect(cache.keys).toHaveBeenCalled();
  });

  it("update кидає ConflictError при unique violation", async () => {
    frequencyRepo.findByIdForUser.mockResolvedValue(sample);
    frequencyRepo.update.mockRejectedValue({ code: "P2002" });

    await expect(service.update(userId, frequencyId, { name: "Dup" })).rejects.toThrow(
      ConflictError,
    );
  });

  it("remove soft-deletes без активних rules", async () => {
    frequencyRepo.findByIdForUser.mockResolvedValue(sample);
    frequencyRepo.countActiveRules.mockResolvedValue(0);
    frequencyRepo.softDelete.mockResolvedValue({
      ...sample,
      isDeleted: true,
      deletedAt: new Date(),
    });

    const result = await service.remove(userId, frequencyId);

    expect(result.isDeleted).toBe(true);
  });

  it("кидає NotFoundError для чужого id", async () => {
    frequencyRepo.findByIdForUser.mockResolvedValue(null);

    await expect(service.getById(userId, frequencyId)).rejects.toThrow(NotFoundError);
  });
});
