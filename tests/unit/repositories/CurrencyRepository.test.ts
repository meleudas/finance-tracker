jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    currency: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { CurrencyRepository } from "../../../src/repositories/impl/CurrencyRepository";

describe("CurrencyRepository", () => {
  let repo: CurrencyRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new CurrencyRepository();
  });

  describe("findByCode", () => {
    it("findFirst з code та isDeleted: false", async () => {
      (prisma.currency.findFirst as jest.Mock).mockResolvedValue(null);

      await repo.findByCode("USD");

      expect(prisma.currency.findFirst).toHaveBeenCalledWith({
        where: { code: "USD", isDeleted: false },
      });
    });
  });

  describe("findActive", () => {
    it("findMany з isDeleted: false та orderBy code asc", async () => {
      (prisma.currency.findMany as jest.Mock).mockResolvedValue([]);

      await repo.findActive();

      expect(prisma.currency.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
        orderBy: { code: "asc" },
      });
    });
  });
});
