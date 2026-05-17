jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { CategoryRepository } from "../../../src/repositories/impl/CategoryRepository";

describe("CategoryRepository", () => {
  let repo: CategoryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new CategoryRepository();
  });

  describe("коректність", () => {
    it("findByUserId: фільтрація за userId та isDeleted: false", async () => {
      const findManyMock = prisma.category.findMany as unknown as jest.Mock;
      findManyMock.mockResolvedValue([]);

      await repo.findByUserId("user-123");

      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId: "user-123", isDeleted: false },
        orderBy: { name: "asc" },
      });
    });

    it("findSubCategories: пошук за parentId", async () => {
      const findManyMock = prisma.category.findMany as unknown as jest.Mock;
      findManyMock.mockResolvedValue([]);

      await repo.findSubCategories("parent-1");

      expect(findManyMock).toHaveBeenCalledWith({
        where: { parentId: "parent-1", isDeleted: false },
      });
    });
  });

  describe("стійкість до зловмисних / крайніх вхідних даних", () => {
    it("findByUserId: SQL injection style input обробляється як скаляр", async () => {
      const malicious = "'; DROP TABLE users;--";
      const findManyMock = prisma.category.findMany as unknown as jest.Mock;
      findManyMock.mockResolvedValue([]);

      await repo.findByUserId(malicious);

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: malicious, isDeleted: false },
        }),
      );
    });
  });
});
