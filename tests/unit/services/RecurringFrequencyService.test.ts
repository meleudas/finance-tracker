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

  it("кидає NotFoundError для чужого id", async () => {
    frequencyRepo.findByIdForUser.mockResolvedValue(null);

    await expect(service.getById(userId, frequencyId)).rejects.toThrow(NotFoundError);
  });
});
