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
import { AbortError } from "../../../src/utils/errors/clientErrors";

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

    it("upsert прокидає параметри валюти в Prisma", async () => {
      const row = { id: "c1", code: "EUR", name: "Euro" };
      (prisma.currency.upsert as jest.Mock).mockResolvedValue(row);

      const params = {
        where: { code: "EUR" },
        create: { code: "EUR", name: "Euro", minorUnits: 2 },
        update: { name: "Euro Updated" },
      };

      await expect(repo.upsert(params)).resolves.toEqual(row);
      expect(prisma.currency.upsert).toHaveBeenCalledWith(params);
    });
  });

  describe("стійкість до зловмисних / крайніх вхідних даних", () => {
    it("upsert з перерваним signal — AbortError", async () => {
      const ac = new AbortController();
      ac.abort();

      await expect(
        repo.upsert(
          { where: { id: "1" }, create: { code: "UAH", name: "Hryvnia" }, update: {} },
          { signal: ac.signal },
        ),
      ).rejects.toThrow(AbortError);
    });
  });
});
