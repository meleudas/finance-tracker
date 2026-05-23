import { CurrencyService } from "../../../src/services/impl/CurrencyService";
import type { ICurrencyRepository } from "../../../src/repositories/interfaces/ICurrencyRepository";
import type { ICache } from "../../../src/redis";
import { NotFoundError } from "../../../src/utils/errors/ClientErrors";
import type { Currency } from "../../../src/generated/prisma/client";

describe("CurrencyService - Unit Tests", () => {
  let currencyService: CurrencyService;
  let mockCurrencyRepo: jest.Mocked<ICurrencyRepository>;
  let cache: jest.Mocked<ICache>;

  const makeCurrency = (overrides: Partial<Currency> = {}): Currency => ({
    id: "clk7v9x1k0000qzq8x8x8x8xb",
    code: "USD",
    name: "US Dollar",
    minorUnits: 2,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockCurrencyRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findActive: jest.fn(),
      findByCode: jest.fn(),
    };

    cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ICache>;

    currencyService = new CurrencyService(mockCurrencyRepo, cache);
  });

  describe("getAllCurrencies", () => {
    it("має повернути список активних валют з репозиторію", async () => {
      const mockCurrencies = [
        makeCurrency({ id: "clm7v9x1k0000qzq8x8x8x8xc", code: "EUR" }),
        makeCurrency({ id: "cln7v9x1k0000qzq8x8x8x8x1", code: "UAH" }),
      ];
      mockCurrencyRepo.findActive.mockResolvedValue(mockCurrencies);

      const result = await currencyService.getAllCurrencies();

      expect(result).toHaveLength(2);
      expect(result[0]?.code).toBe("EUR");
      expect(result[0]).not.toHaveProperty("isDeleted");
      expect(mockCurrencyRepo.findActive).toHaveBeenCalledWith(undefined);
    });

    it("не викликає репозиторій при cache hit", async () => {
      const cachedDto = [
        {
          id: "clk7v9x1k0000qzq8x8x8x8xb",
          code: "USD",
          name: "US Dollar",
          minorUnits: 2,
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
      ];
      cache.getJson.mockResolvedValueOnce(cachedDto);

      const result = await currencyService.getAllCurrencies();

      expect(result).toEqual(cachedDto);
      expect(mockCurrencyRepo.findActive).not.toHaveBeenCalled();
    });
  });

  describe("getCurrencyByCode", () => {
    it("має нормалізувати код і повернути валюту", async () => {
      mockCurrencyRepo.findByCode.mockResolvedValue(makeCurrency({ code: "EUR" }));

      const result = await currencyService.getCurrencyByCode("  eur ");

      expect(result.code).toBe("EUR");
      expect(result).not.toHaveProperty("isDeleted");
      expect(mockCurrencyRepo.findByCode).toHaveBeenCalledWith("EUR", undefined);
    });

    it("має викинути NotFoundError, якщо валюту не знайдено", async () => {
      mockCurrencyRepo.findByCode.mockResolvedValue(null);

      await expect(currencyService.getCurrencyByCode("XXX")).rejects.toThrow(
        new NotFoundError("Currency with code XXX not found"),
      );
    });
  });

  describe("getCurrencyById", () => {
    it("має повернути валюту за id", async () => {
      const currency = makeCurrency();
      mockCurrencyRepo.findById.mockResolvedValue(currency);

      const result = await currencyService.getCurrencyById(currency.id);

      expect(result.id).toBe(currency.id);
    });

    it("має викинути NotFoundError для видаленої або відсутньої валюти", async () => {
      mockCurrencyRepo.findById.mockResolvedValue(
        makeCurrency({ isDeleted: true, deletedAt: new Date() }),
      );

      await expect(currencyService.getCurrencyById("clk7v9x1k0000qzq8x8x8x8xb")).rejects.toThrow(
        new NotFoundError("Currency not found"),
      );
    });
  });
});
