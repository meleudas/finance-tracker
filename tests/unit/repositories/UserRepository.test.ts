jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { UserRepository } from "../../../src/repositories/impl/UserRepository";
import { AbortError } from "../../../src/utils/errors/ClientErrors";

describe("UserRepository", () => {
  let repo: UserRepository;
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const email = "user@example.com";

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new UserRepository();
  });

  describe("BaseRepository delegation", () => {
    it("findById використовує user delegate", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });

      await repo.findById(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId, isDeleted: false },
      });
    });
  });

  describe("findByEmail", () => {
    it("шукає за email та isDeleted: false", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await repo.findByEmail(email);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email, isDeleted: false },
      });
    });

    it("кидає AbortError при перерваному signal", async () => {
      const ac = new AbortController();
      ac.abort();

      await expect(repo.findByEmail(email, { signal: ac.signal })).rejects.toThrow(AbortError);
    });
  });

  describe("findByIdWithRelations", () => {
    it("включає пов’язані сутності", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await repo.findByIdWithRelations(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId, isDeleted: false },
        include: {
          accounts: true,
          transactions: true,
          categories: true,
          budgets: true,
          recurringRules: true,
        },
      });
    });
  });

  describe("findByEmailWithRelations", () => {
    it("шукає за email з include", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await repo.findByEmailWithRelations(email);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email, isDeleted: false },
        include: expect.objectContaining({ accounts: true }),
      });
    });
  });

  describe("existsByEmail", () => {
    it("повертає true, якщо count > 0", async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const result = await repo.existsByEmail(email);

      expect(result).toBe(true);
    });

    it("повертає false, якщо count = 0", async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const result = await repo.existsByEmail(email);

      expect(result).toBe(false);
    });
  });

  describe("findWithAccounts / findWithTransactions", () => {
    it("findWithAccounts включає accounts", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await repo.findWithAccounts(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId, isDeleted: false },
        include: { accounts: true },
      });
    });

    it("findWithTransactions включає transactions", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await repo.findWithTransactions(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId, isDeleted: false },
        include: { transactions: true },
      });
    });
  });
});
