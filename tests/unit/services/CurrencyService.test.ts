import { CurrencyService } from "../../../src/services/impl/CurrencyService";
import { NotFoundError } from "../../../src/utils/errors/СlientErrors";

interface MockPrismaTx {
  currency: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
}

const mockPrismaTx: MockPrismaTx = {
  currency: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) => callback(mockPrismaTx)),
    currency: {
      findMany: jest.fn(
        async (args: unknown): Promise<unknown> =>
          Promise.resolve(mockPrismaTx.currency.findMany(args)),
      ),
      findUnique: jest.fn(
        async (args: unknown): Promise<unknown> =>
          Promise.resolve(mockPrismaTx.currency.findUnique(args)),
      ),
    },
  },
}));

describe("CurrencyService - Unit Tests", () => {
  let currencyService: CurrencyService;

  beforeEach(() => {
    jest.clearAllMocks();
    currencyService = new CurrencyService();
  });

  describe("getAllCurrencies", () => {
    it("має повернути список усіх доступних валют відсортованих за кодом", async () => {
      const mockCurrencies = [
        { id: "1", code: "EUR", name: "Euro", minorUnits: 2, isDeleted: false },
        { id: "2", code: "UAH", name: "Ukrainian Hryvnia", minorUnits: 2, isDeleted: false },
      ];
      mockPrismaTx.currency.findMany.mockResolvedValue(mockCurrencies);

      const result = await currencyService.getAllCurrencies();

      expect(result).toHaveLength(2);
      expect(mockPrismaTx.currency.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
        orderBy: { code: "asc" },
      });
    });
  });

  describe("getCurrencyByCode", () => {
    it("має успішно знайти валюту, автоматично трансформувавши код у верхній регістр", async () => {
      const mockCurrency = {
        id: "1",
        code: "USD",
        name: "US Dollar",
        minorUnits: 2,
        isDeleted: false,
      };
      mockPrismaTx.currency.findUnique.mockResolvedValue(mockCurrency);

      // Передаємо в нижньому регістрі з пробілами
      const result = await currencyService.getCurrencyByCode("   usd   ");

      expect(result?.code).toBe("USD");
      expect(mockPrismaTx.currency.findUnique).toHaveBeenCalledWith({
        where: { code: "USD" },
      });
    });

    it("має викинути помилку CURRENCY_NOT_FOUND, якщо валюти немає або вона позначена як видалена", async () => {
      mockPrismaTx.currency.findUnique.mockResolvedValue(null);

      await expect(currencyService.getCurrencyByCode("XYZ")).rejects.toThrow(
        new NotFoundError("Валюту з кодом XYZ не знайдено в системі"),
      );
    });
  });
});
