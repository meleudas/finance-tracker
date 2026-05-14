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
import { AbortError } from "../../../src/utils/withAbortSignal";

type LocalCategoryKind = "INCOME" | "EXPENSE";

interface MockUpsertParams {
  where: { id: string };
  create: {
    userId: string;
    name: string;
    kind: LocalCategoryKind;
  };
  update: { name: string };
}

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

    it("upsert прокидає CategoryKind та userId", async () => {
      const params: MockUpsertParams = {
        where: { id: "cat-1" },
        create: {
          userId: "u1",
          name: "Food",
          kind: "EXPENSE",
        },
        update: { name: "Groceries" },
      };

      const upsertMock = prisma.category.upsert as unknown as jest.Mock;
      upsertMock.mockResolvedValue({ id: "cat-1" });

      await repo.upsert(params); // as never використовується, щоб обійти конфлікт несумісних типів без any
      expect(upsertMock).toHaveBeenCalledWith(params);
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

    it("upsert з перерваним signal — AbortError", async () => {
      const ac = new AbortController();
      ac.abort();

      const upsertMock = prisma.category.upsert as unknown as jest.Mock;
      upsertMock.mockResolvedValue({ id: "cat-1" });

      const params: MockUpsertParams = {
        where: { id: "cat-1" },
        create: {
          userId: "u1",
          name: "Salary",
          kind: "INCOME",
        },
        update: { name: "Bonus" },
      };

      await expect(repo.upsert(params as never, { signal: ac.signal })).rejects.toThrow(AbortError);

      expect(upsertMock).toHaveBeenCalledTimes(1);
    });
  });
});
