jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
    },
    budget: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { CategoryRepository } from "../../../src/repositories/impl/CategoryRepository";
import { AbortError, ConflictError, NotFoundError } from "../../../src/utils/errors/ClientErrors";

describe("CategoryRepository", () => {
  let repo: CategoryRepository;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const categoryId = "clk7v9x1k0000qzq8x8x8x8xb";
  const childId = "clm7v9x1k0000qzq8x8x8x8xc";

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new CategoryRepository();
  });

  describe("findByUserId / findSubCategories", () => {
    it("findByUserId: фільтрація за userId та isDeleted: false", async () => {
      const findManyMock = prisma.category.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      await repo.findByUserId(userId);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId, isDeleted: false },
        orderBy: { name: "asc" },
      });
    });

    it("findSubCategories: пошук за parentId", async () => {
      const findManyMock = prisma.category.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      await repo.findSubCategories(categoryId);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { parentId: categoryId, isDeleted: false },
      });
    });
  });

  describe("existsWithSameName", () => {
    it("повертає true, якщо count > 0", async () => {
      (prisma.category.count as jest.Mock).mockResolvedValue(1);

      const result = await repo.existsWithSameName(userId, "Food", null, "EXPENSE");

      expect(result).toBe(true);
      expect(prisma.category.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            isDeleted: false,
            parentId: null,
            kind: "EXPENSE",
          }),
        }),
      );
    });

    it("викидає AbortError при перерваному signal", async () => {
      const ac = new AbortController();
      ac.abort();

      await expect(
        repo.existsWithSameName(userId, "Food", null, "EXPENSE", undefined, {
          signal: ac.signal,
        }),
      ).rejects.toThrow(AbortError);
    });
  });

  describe("hasActiveTransactions", () => {
    it("повертає true, якщо є активні транзакції", async () => {
      (prisma.transaction.count as jest.Mock).mockResolvedValue(2);

      const result = await repo.hasActiveTransactions([categoryId, childId]);

      expect(result).toBe(true);
    });

    it("повертає false для порожнього списку id", async () => {
      const result = await repo.hasActiveTransactions([]);

      expect(result).toBe(false);
      expect(prisma.transaction.count).not.toHaveBeenCalled();
    });
  });

  describe("deleteWithHierarchy", () => {
    const category = {
      id: categoryId,
      userId,
      name: "Root",
      kind: "EXPENSE" as const,
      parentId: null,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const child = {
      id: childId,
      userId,
      name: "Child",
      kind: "EXPENSE" as const,
      parentId: categoryId,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    beforeEach(() => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(category);
      (prisma.category.findMany as jest.Mock).mockImplementation(
        (args: { where: { parentId?: string } }) => {
          if (args.where.parentId === categoryId) {
            return Promise.resolve([child]);
          }
          return Promise.resolve([]);
        },
      );
      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: (tx: typeof prisma) => Promise<void>) => callback(prisma),
      );
    });

    it("кидає NotFoundError, якщо категорія не знайдена", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(repo.deleteWithHierarchy(userId, categoryId)).rejects.toThrow(
        new NotFoundError("Category"),
      );
    });

    it("кидає ConflictError, якщо є активні транзакції", async () => {
      (prisma.transaction.count as jest.Mock).mockResolvedValue(3);

      await expect(repo.deleteWithHierarchy(userId, categoryId)).rejects.toThrow(
        new ConflictError(
          "Cannot delete category with active financial history. Reassign transactions first.",
        ),
      );
    });

    it("soft-delete піддерево та відв’язує budgets", async () => {
      (prisma.transaction.count as jest.Mock).mockResolvedValue(0);
      (prisma.budget.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.category.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      await repo.deleteWithHierarchy(userId, categoryId);

      expect(prisma.budget.updateMany).toHaveBeenCalledWith({
        where: { categoryId: { in: [categoryId, childId] } },
        data: { categoryId: null },
      });
      expect(prisma.category.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [categoryId, childId] }, userId },
        data: expect.objectContaining({ isDeleted: true, deletedAt: expect.any(Date) }),
      });
    });
  });
});
