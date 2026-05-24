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

  describe("BaseRepository delegation", () => {
    it("findById використовує currency delegate", async () => {
      (prisma.currency.findUnique as jest.Mock).mockResolvedValue({ id: "c1", code: "USD" });

      await repo.findById("c1");

      expect(prisma.currency.findUnique).toHaveBeenCalledWith({
        where: { id: "c1", isDeleted: false },
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
