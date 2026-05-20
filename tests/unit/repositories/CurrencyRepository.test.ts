jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    currency: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { CurrencyRepository } from "../../../src/repositories/impl/CurrencyRepository";
//import { AbortError } from "../../../src/utils/errors/СlientErrors";

describe("CurrencyRepository", () => {
  let repo: CurrencyRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new CurrencyRepository();
  });

  describe("коректність", () => {
    it("findByCode: findUnique з кодом валюти", async () => {
      (prisma.currency.findUnique as jest.Mock).mockResolvedValue(null);
      await repo.findByCode("USD");
      expect(prisma.currency.findUnique).toHaveBeenCalledWith({
        where: { code: "USD" },
      });
    });

    it("findAll: повертає список усіх валют", async () => {
      const mockCurrencies = [
        { id: "1", code: "USD", name: "Dollar" },
        { id: "2", code: "UAH", name: "Hryvnia" },
      ];
      (prisma.currency.findMany as jest.Mock).mockResolvedValue(mockCurrencies);
      const result = await repo.findAll();
      expect(prisma.currency.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockCurrencies);
    });
  });
});
