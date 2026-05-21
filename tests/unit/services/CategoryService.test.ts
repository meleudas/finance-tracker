import { CategoryService } from "../../../src/services/impl/CategoryService";
import type { ICategoryRepository } from "../../../src/repositories/interfaces/ICategoryRepository";
import type { ICache } from "../../../src/redis";
import type { Category } from "../../../src/generated/prisma/client";

describe("CategoryService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const categoryId = "clk7v9x1k0000qzq8x8x8x8xb";

  let categoryRepo: jest.Mocked<ICategoryRepository>;
  let cache: jest.Mocked<ICache>;
  let service: CategoryService;

  const makeCategory = (overrides: Partial<Category> = {}): Category => ({
    id: categoryId,
    userId,
    name: "Food",
    kind: "EXPENSE",
    parentId: null,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    deletedAt: null,
    isDeleted: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    categoryRepo = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteWithHierarchy: jest.fn(),
      existsWithSameName: jest.fn(),
      findSubCategories: jest.fn(),
    } as unknown as jest.Mocked<ICategoryRepository>;

    cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ICache>;

    service = new CategoryService(categoryRepo, cache);
  });

  describe("getCategoryTree", () => {
    it("returns cached tree without hitting repository", async () => {
      const tree = [{ ...makeCategory(), children: [] }];
      cache.getJson.mockResolvedValueOnce(tree);

      const result = await service.getCategoryTree(userId);

      expect(result).toEqual(tree);
      expect(categoryRepo.findByUserId).not.toHaveBeenCalled();
    });

    it("loads tree from repository on cache miss", async () => {
      categoryRepo.findByUserId.mockResolvedValue([makeCategory()]);

      await service.getCategoryTree(userId);

      expect(categoryRepo.findByUserId).toHaveBeenCalledWith(userId, undefined);
      expect(cache.setJson).toHaveBeenCalledWith(
        `category:tree:${userId}`,
        expect.any(Array),
        expect.any(Number),
      );
    });
  });

  describe("createCategory", () => {
    it("invalidates category cache after create", async () => {
      categoryRepo.existsWithSameName.mockResolvedValue(false);
      categoryRepo.create.mockResolvedValue(makeCategory());

      await service.createCategory(userId, {
        name: "Food",
        kind: "EXPENSE",
      });

      expect(cache.delete).toHaveBeenCalledWith(`category:tree:${userId}`);
      expect(cache.keys).toHaveBeenCalledWith(`category:item:${userId}:*`);
      expect(categoryRepo.existsWithSameName).toHaveBeenCalledWith(
        userId,
        "Food",
        null,
        "EXPENSE",
        undefined,
        undefined,
      );
    });

    it("передає abort signal у existsWithSameName", async () => {
      const ac = new AbortController();
      categoryRepo.existsWithSameName.mockResolvedValue(false);
      categoryRepo.create.mockResolvedValue(makeCategory());

      await service.createCategory(
        userId,
        { name: "Food", kind: "EXPENSE" },
        { signal: ac.signal },
      );

      expect(categoryRepo.existsWithSameName).toHaveBeenCalledWith(
        userId,
        "Food",
        null,
        "EXPENSE",
        undefined,
        { signal: ac.signal },
      );
    });
  });
});
