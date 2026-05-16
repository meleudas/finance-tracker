import { prisma as globalPrisma } from "../../config/prismaClient";
import type { Category } from "../../generated/prisma/client";
import type { ICategoryRepository } from "../../repositories/interfaces/ICategoryRepository";
import type {
  ICategoryService,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryNode,
} from "../interfaces/ICategoryService";
import type { RequestOptions } from "../../repositories/interfaces/IBaseRepository";
import { NotFoundError } from "../../utils/errors/СlientErrors";
import { ForbiddenError } from "../../utils/errors/SecurityErrors";
import { ValidationError } from "../../utils/errors/СlientErrors";
import { ConflictError } from "../../utils/errors/СlientErrors";

type PrismaTransactionClient = Parameters<Parameters<typeof globalPrisma.$transaction>[0]>[0];

export interface CategoryRequestOptions extends RequestOptions {
  tx?: PrismaTransactionClient;
}

/**
 * ============================================================================
 * БІЗНЕС-ПРАВИЛА ТА ІНВАРІАНТИ ДЛЯ СУТНОСТІ "CATEGORY" (КАТЕГОРІЯ)
 * ============================================================================
 *
 * 1. ІЗОЛЯЦІЯ ДАНИХ (БЕЗПЕКА):
 *    Користувач має доступ виключно до власних категорій.
 *
 * 2. УНІКАЛЬНІСТЬ НАЗВИ:
 *    В межах одного рівня ієрархії не може існувати двох категорій з однаковим ім'ям.
 *
 * 3. ЦІЛІСНІСТЬ ІЄРАРХІЇ:
 *    Тип підкатегорії має суворо збігатися з типом батьківської категорії.
 *
 * 4. ЗАХИСТ ІСТОРІЇ ЗВІТІВ:
 *    Категорію заборонено видаляти, якщо в системі є активні транзакції.
 *
 * 5. UP-TO-DOWN SOFT DELETE:
 *    Видалення батьківської категорії запускає процес м'якого видалення підкатегорій та бюджетів.
 */
export class CategoryService implements ICategoryService {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async createCategory(
    dto: CreateCategoryDTO,
    options?: CategoryRequestOptions,
  ): Promise<Category> {
    const tx = options?.tx ?? globalPrisma;

    if (dto.parentId) {
      const parent = await tx.category.findUnique({
        where: { id: dto.parentId, isDeleted: false },
      });

      if (!parent) {
        throw new NotFoundError("Parent category");
      }
      if (parent.userId !== dto.userId) {
        throw new ForbiddenError("You do not have permission to use this parent category");
      }
      if (parent.kind !== dto.kind) {
        throw new ValidationError("Child category must have the same kind as parent");
      }
    }

    const existingCategories = await this.categoryRepo.findByUserId(dto.userId, options);
    const isDuplicate = existingCategories.some(
      (c) =>
        c.name.toLowerCase() === dto.name.trim().toLowerCase() &&
        c.parentId === (dto.parentId ?? null) &&
        c.kind === dto.kind,
    );

    if (isDuplicate) {
      throw new ConflictError("Category with this name already exists at this level");
    }

    return this.categoryRepo.create(
      {
        userId: dto.userId,
        name: dto.name.trim(),
        kind: dto.kind,
        parentId: dto.parentId ?? null,
      },
      options,
    );
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDTO,
    options?: CategoryRequestOptions,
  ): Promise<Category> {
    const tx = options?.tx ?? globalPrisma;

    const currentCategory = await tx.category.findUnique({
      where: { id: categoryId, userId, isDeleted: false },
    });
    if (!currentCategory) {
      throw new NotFoundError("Category");
    }

    const updateData: Record<string, unknown> = {};

    const repoOptions = options as unknown as RequestOptions;

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();

      if (trimmedName !== currentCategory.name) {
        const targetParentId = dto.parentId !== undefined ? dto.parentId : currentCategory.parentId;
        const allCategories = await this.categoryRepo.findByUserId(userId, repoOptions);

        const isDuplicate = allCategories.some(
          (c) =>
            c.id !== categoryId &&
            c.name.toLowerCase() === trimmedName.toLowerCase() &&
            c.parentId === targetParentId &&
            c.kind === currentCategory.kind,
        );

        if (isDuplicate) {
          throw new ConflictError("Category with this name already exists at this level");
        }
        updateData.name = trimmedName;
      }
    }

    return this.categoryRepo.update(categoryId, updateData, repoOptions);
  }

  async deleteCategory(
    userId: string,
    categoryId: string,
    options?: CategoryRequestOptions,
  ): Promise<void> {
    await globalPrisma.$transaction(async (tx) => {
      const txOptions = { ...options, tx };

      const rootCategory = await tx.category.findUnique({
        where: { id: categoryId, userId, isDeleted: false },
      });
      if (!rootCategory) {
        throw new NotFoundError("Category");
      }

      const subCategories = await this.categoryRepo.findSubCategories(categoryId, txOptions);
      const allCategoryIds = [rootCategory.id, ...subCategories.map((sub) => sub.id)];

      const transactionsCount = await tx.transaction.count({
        where: { categoryId: { in: allCategoryIds }, isDeleted: false },
      });

      if (transactionsCount > 0) {
        throw new ConflictError(
          "Cannot delete category with active financial history. Reassign transactions first.",
        );
      }

      const now = new Date();

      await tx.budget.updateMany({
        where: { categoryId: { in: allCategoryIds }, isDeleted: false },
        data: { isDeleted: true, deletedAt: now },
      });

      await tx.category.updateMany({
        where: { id: { in: allCategoryIds } },
        data: { isDeleted: true, deletedAt: now },
      });
    });
  }

  async getCategoryTree(userId: string, options?: CategoryRequestOptions): Promise<CategoryNode[]> {
    const flatCategories = await this.categoryRepo.findByUserId(userId, options);
    const map = new Map<string, CategoryNode>();
    flatCategories.forEach((category) => map.set(category.id, { ...category, children: [] }));

    const rootNodes: CategoryNode[] = [];
    map.forEach((node) => {
      if (node.parentId) {
        const parent = map.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  async getCategoryById(
    userId: string,
    categoryId: string,
    options?: CategoryRequestOptions,
  ): Promise<Category | null> {
    const category = await this.categoryRepo.findById(categoryId, options);
    if (category?.userId !== userId) {
      throw new NotFoundError("Category");
    }
    return category;
  }
}
