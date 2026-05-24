import { CategoryService } from "../../../src/services/impl/CategoryService";
import type { ICategoryRepository } from "../../../src/repositories/interfaces/ICategoryRepository";
import type { ICache } from "../../../src/redis";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../src/utils/errors/ClientErrors";
import { ForbiddenError } from "../../../src/utils/errors/securityErrors";
import type { Category } from "../../../src/generated/prisma/client";

describe("CategoryService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const otherUserId = "cln7v9x1k0000qzq8x8x8x8x1";
  const categoryId = "clk7v9x1k0000qzq8x8x8x8xb";
  const parentId = "clm7v9x1k0000qzq8x8x8x8xc";
  const childId = "cln7v9x1k0000qzq8x8x8x8x2";

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
      keys: jest.fn().mockResolvedValue(["category:item:u:1"]),
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

    it("builds nested tree and orphans without parent", async () => {
      categoryRepo.findByUserId.mockResolvedValue([
        makeCategory({ id: parentId, parentId: null }),
        makeCategory({ id: childId, parentId }),
        makeCategory({ id: "clorphan00000000000000001", parentId: "missing-parent" }),
      ]);

      const result = await service.getCategoryTree(userId);

      expect(result).toHaveLength(2);
      expect(result.find((n) => n.id === parentId)?.children).toHaveLength(1);
      expect(cache.setJson).toHaveBeenCalled();
    });
  });

  describe("getCategoryById", () => {
    it("returns cached category", async () => {
      const cached = makeCategory();
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getCategoryById(userId, categoryId);

      expect(result).toBe(cached);
      expect(categoryRepo.findById).not.toHaveBeenCalled();
    });

    it("throws NotFoundError for missing or foreign category", async () => {
      categoryRepo.findById.mockResolvedValueOnce(null);
      await expect(service.getCategoryById(userId, categoryId)).rejects.toThrow(NotFoundError);

      categoryRepo.findById.mockResolvedValueOnce(makeCategory({ userId: otherUserId }));
      await expect(service.getCategoryById(userId, categoryId)).rejects.toThrow(NotFoundError);

      categoryRepo.findById.mockResolvedValueOnce(makeCategory({ isDeleted: true }));
      await expect(service.getCategoryById(userId, categoryId)).rejects.toThrow(NotFoundError);
    });

    it("loads from repository on cache miss", async () => {
      categoryRepo.findById.mockResolvedValue(makeCategory());

      const result = await service.getCategoryById(userId, categoryId);

      expect(result.name).toBe("Food");
      expect(cache.setJson).toHaveBeenCalled();
    });
  });

  describe("createCategory", () => {
    it("throws ConflictError on duplicate name", async () => {
      categoryRepo.existsWithSameName.mockResolvedValue(true);

      await expect(
        service.createCategory(userId, { name: "Food", kind: "EXPENSE" }),
      ).rejects.toThrow(ConflictError);
    });

    it("validates parent category", async () => {
      categoryRepo.findById.mockResolvedValue(makeCategory({ id: parentId, kind: "INCOME" }));

      await expect(
        service.createCategory(userId, {
          name: "Sub",
          kind: "EXPENSE",
          parentId,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError for missing parent", async () => {
      categoryRepo.findById.mockResolvedValue(null);

      await expect(
        service.createCategory(userId, {
          name: "Sub",
          kind: "EXPENSE",
          parentId,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError for foreign parent", async () => {
      categoryRepo.findById.mockResolvedValue(
        makeCategory({ id: parentId, userId: otherUserId, kind: "EXPENSE" }),
      );

      await expect(
        service.createCategory(userId, {
          name: "Sub",
          kind: "EXPENSE",
          parentId,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("creates category and invalidates cache", async () => {
      categoryRepo.existsWithSameName.mockResolvedValue(false);
      categoryRepo.create.mockResolvedValue(makeCategory());

      await service.createCategory(userId, { name: "Food", kind: "EXPENSE" });

      expect(cache.delete).toHaveBeenCalledWith(`category:tree:${userId}`);
      expect(cache.keys).toHaveBeenCalled();
    });
  });

  describe("updateCategory", () => {
    it("returns current category when no changes", async () => {
      categoryRepo.findById.mockResolvedValue(makeCategory());

      const result = await service.updateCategory(userId, categoryId, {});

      expect(result.name).toBe("Food");
      expect(categoryRepo.update).not.toHaveBeenCalled();
    });

    it("throws ValidationError when category is its own parent", async () => {
      categoryRepo.findById.mockResolvedValue(makeCategory());

      await expect(
        service.updateCategory(userId, categoryId, { parentId: categoryId }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when moving under descendant", async () => {
      categoryRepo.findById.mockResolvedValue(makeCategory());
      categoryRepo.findSubCategories.mockImplementation((parentId: string) => {
        if (parentId === categoryId) {
          return Promise.resolve([{ id: childId } as Category]);
        }
        return Promise.resolve([]);
      });

      await expect(
        service.updateCategory(userId, categoryId, { parentId: childId }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ConflictError on duplicate name at level", async () => {
      categoryRepo.findById.mockResolvedValue(makeCategory());
      categoryRepo.existsWithSameName.mockResolvedValue(true);

      await expect(
        service.updateCategory(userId, categoryId, { name: "Duplicate" }),
      ).rejects.toThrow(ConflictError);
    });

    it("updates category and invalidates item cache", async () => {
      categoryRepo.findById.mockResolvedValue(makeCategory());
      categoryRepo.existsWithSameName.mockResolvedValue(false);
      categoryRepo.update.mockResolvedValue(makeCategory({ name: "Updated" }));

      const result = await service.updateCategory(userId, categoryId, { name: "Updated" });

      expect(result.name).toBe("Updated");
      expect(cache.delete).toHaveBeenCalledWith(`category:item:${userId}:${categoryId}`);
    });

    it("allows clearing parent to null", async () => {
      categoryRepo.findById.mockResolvedValue(makeCategory({ parentId }));
      categoryRepo.existsWithSameName.mockResolvedValue(false);
      categoryRepo.update.mockResolvedValue(makeCategory({ parentId: null }));

      await service.updateCategory(userId, categoryId, { parentId: null });

      expect(categoryRepo.update).toHaveBeenCalledWith(categoryId, { parentId: null }, undefined);
    });
  });

  describe("deleteCategory", () => {
    it("deletes hierarchy and invalidates cache", async () => {
      await service.deleteCategory(userId, categoryId);

      expect(categoryRepo.deleteWithHierarchy).toHaveBeenCalledWith(userId, categoryId, undefined);
      expect(cache.delete).toHaveBeenCalled();
    });
  });
});
