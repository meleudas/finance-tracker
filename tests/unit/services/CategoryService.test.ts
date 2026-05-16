import { CategoryService } from "../../../src/services/impl/CategoryService";
import type { ICategoryRepository } from "../../../src/repositories/interfaces/ICategoryRepository";
import { NotFoundError, ConflictError } from "../../../src/utils/errors/clientErrors";
import { ForbiddenError } from "../../../src/utils/errors/securityErrors";
import { ValidationError } from "../../../src/utils/errors/clientErrors";
import type { Category } from "../../../src/generated/prisma/client";

interface MockPrismaTx {
  category: { findUnique: jest.Mock; updateMany: jest.Mock };
  transaction: { count: jest.Mock };
  budget: { updateMany: jest.Mock };
}

const mockPrismaTx: MockPrismaTx = {
  category: { findUnique: jest.fn(), updateMany: jest.fn() },
  transaction: { count: jest.fn() },
  budget: { updateMany: jest.fn() },
};

jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) => callback(mockPrismaTx)),
    category: {
      findUnique: jest.fn(
        async (args: unknown): Promise<unknown> =>
          Promise.resolve(mockPrismaTx.category.findUnique(args)),
      ),
    },
  },
}));

describe("CategoryService - Unit Tests", () => {
  let categoryService: CategoryService;
  let mockCategoryRepo: jest.Mocked<ICategoryRepository>;
  const userId = "user_cl9123abc";

  beforeEach(() => {
    jest.clearAllMocks();

    mockCategoryRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findByUserId: jest.fn(),
      findSubCategories: jest.fn(),
      upsert: jest.fn(),
    };

    categoryService = new CategoryService(mockCategoryRepo);
  });

  describe("createCategory", () => {
    it("має успішно створити кореневу категорію, якщо немає дублікатів", async () => {
      const dto = { userId, name: "Продукти", kind: "EXPENSE" as const };

      mockCategoryRepo.findByUserId.mockResolvedValue([]);
      mockCategoryRepo.create.mockResolvedValue({
        id: "cat_1",
        ...dto,
        parentId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const result = await categoryService.createCategory(dto);

      expect(result.id).toBe("cat_1");
    });

    it("має викинути помилку ConflictError, якщо категорія з таким ім'ям вже є на цьому рівні", async () => {
      const dto = { userId, name: "   Продукти   ", kind: "EXPENSE" as const };

      mockCategoryRepo.findByUserId.mockResolvedValue([
        {
          id: "cat_old",
          userId,
          name: "Продукти",
          kind: "EXPENSE",
          parentId: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ]);

      await expect(categoryService.createCategory(dto)).rejects.toThrow(
        new ConflictError("Category with this name already exists at this level"),
      );
    });

    it("має викинути помилку NotFoundError, якщо вказаного parentId не існує в БД", async () => {
      const dto = { userId, name: "Молочка", kind: "EXPENSE" as const, parentId: "invalid_parent" };

      mockPrismaTx.category.findUnique.mockResolvedValue(null);

      await expect(categoryService.createCategory(dto)).rejects.toThrow(
        new NotFoundError("Parent category"),
      );
    });

    it("має викинути помилку ForbiddenError, якщо батьківська категорія належить іншому юзеру", async () => {
      const dto = { userId, name: "Молочка", kind: "EXPENSE" as const, parentId: "parent_xyz" };

      mockPrismaTx.category.findUnique.mockResolvedValue({
        id: "parent_xyz",
        userId: "other_user_id",
        kind: "EXPENSE",
        isDeleted: false,
      });

      await expect(categoryService.createCategory(dto)).rejects.toThrow(
        new ForbiddenError("You do not have permission to use this parent category"),
      );
    });

    it("має викинути помилку ValidationError, якщо тип дитини не збігається з типом батька", async () => {
      const dto = { userId, name: "Кешбек", kind: "INCOME" as const, parentId: "parent_expense" };

      mockPrismaTx.category.findUnique.mockResolvedValue({
        id: "parent_expense",
        userId,
        kind: "EXPENSE",
        isDeleted: false,
      });

      await expect(categoryService.createCategory(dto)).rejects.toThrow(
        new ValidationError("Child category must have the same kind as parent"),
      );
    });
  });

  describe("deleteCategory", () => {
    it("має викинути помилку ConflictError, якщо категорія або підкатегорії мають фінансову історію", async () => {
      mockPrismaTx.category.findUnique.mockResolvedValue({
        id: "cat_root",
        userId,
        isDeleted: false,
      });

      mockCategoryRepo.findSubCategories.mockResolvedValue([
        {
          id: "cat_sub_1",
          userId,
          name: "Субкатегорія",
          kind: "EXPENSE",
          parentId: "cat_root",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ]);

      mockPrismaTx.transaction.count.mockResolvedValue(3);

      await expect(categoryService.deleteCategory(userId, "cat_root")).rejects.toThrow(
        new ConflictError(
          "Cannot delete category with active financial history. Reassign transactions first.",
        ),
      );
    });

    it("має успішно виконати софт-деліт для категорії, її дітей та бюджетів, якщо транзакцій немає", async () => {
      mockPrismaTx.category.findUnique.mockResolvedValue({
        id: "cat_root",
        userId,
        isDeleted: false,
      });
      mockCategoryRepo.findSubCategories.mockResolvedValue([
        {
          id: "cat_child",
          userId,
          name: "Дочірня",
          kind: "EXPENSE",
          parentId: "cat_root",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ]);

      mockPrismaTx.transaction.count.mockResolvedValue(0);

      await categoryService.deleteCategory(userId, "cat_root");

      expect(mockPrismaTx.budget.updateMany).toHaveBeenCalled();
      expect(mockPrismaTx.category.updateMany).toHaveBeenCalled();
    });
  });

  describe("getCategoryTree", () => {
    it("має правильно зібрати плоский масив з БД у деревоподібну структуру для фронтенду", async () => {
      const flatData: Category[] = [
        {
          id: "1",
          userId,
          name: "Авто",
          kind: "EXPENSE",
          parentId: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: "2",
          userId,
          name: "Паливо",
          kind: "EXPENSE",
          parentId: "1",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: "3",
          userId,
          name: "Мийка",
          kind: "EXPENSE",
          parentId: "1",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: "4",
          userId,
          name: "Зарплата",
          kind: "INCOME",
          parentId: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      // Використовуємо повернення типу самого методу сервісу, щоб лінтер не лаявся на unknown/any кастинг
      mockCategoryRepo.findByUserId.mockResolvedValue(flatData);

      const tree = await categoryService.getCategoryTree(userId);

      expect(tree).toHaveLength(2);

      const autoNode = tree.find((node) => node.id === "1");

      if (autoNode?.children) {
        expect(autoNode.children).toHaveLength(2);

        const fuelNode = autoNode.children[0];
        const washNode = autoNode.children[1];

        if (fuelNode && washNode) {
          expect(fuelNode.id).toBe("2");
          expect(washNode.id).toBe("3");
        }
      }
    });
  });
});
