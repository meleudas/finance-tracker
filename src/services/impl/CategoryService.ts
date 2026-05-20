// src/services/impl/CategoryService.ts
import type { Category } from "../../generated/prisma/client";
import type { ICategoryRepository } from "../../repositories/interfaces/ICategoryRepository";
import type { ICategoryService, CategoryNode } from "../interfaces/ICategoryService";
import type { RequestOptions } from "../../repositories/interfaces/IBaseRepository";
import { NotFoundError, ValidationError, ConflictError } from "../../utils/errors/СlientErrors";
import { ForbiddenError } from "../../utils/errors/SecurityErrors";
import type { CreateCategoryDto } from "../../dtos/category/CreateCategory.dto";
import type { UpdateCategoryDto } from "../../dtos/category/UpdateCategory.dto";

export class CategoryService implements ICategoryService {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async createCategory(
    userId: string,
    dto: CreateCategoryDto,
    options?: RequestOptions,
  ): Promise<Category> {
    // 1. Валідація батьківської категорії (якщо є) — через репозиторій
    if (dto.parentId) {
      const parent = await this.categoryRepo.findById(dto.parentId, options);

      if (!parent || parent.isDeleted) {
        throw new NotFoundError("Parent category");
      }
      if (parent.userId !== userId) {
        throw new ForbiddenError("You do not have permission to use this parent category");
      }
      if (parent.kind !== dto.kind) {
        throw new ValidationError("Child category must have the same kind as parent");
      }
    }

    // 2. Перевірка унікальності назви на рівні ієрархії
    const existingCategories = await this.categoryRepo.findByUserId(userId, options);
    const isDuplicate = existingCategories.some(
      (c) =>
        c.name.toLowerCase() === dto.name.trim().toLowerCase() &&
        c.parentId === (dto.parentId ?? null) &&
        c.kind === dto.kind,
    );

    if (isDuplicate) {
      throw new ConflictError("Category with this name already exists at this level");
    }

    // 3. Створення категорії — через репозиторій
    return this.categoryRepo.create(
      {
        userId,
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
    dto: UpdateCategoryDto,
    options?: RequestOptions,
  ): Promise<Category> {
    const currentCategory = await this.categoryRepo.findById(categoryId, options);
    
    if (!currentCategory || currentCategory.isDeleted || currentCategory.userId !== userId) {
      throw new NotFoundError("Category");
    }

    const updateData: Record<string, unknown> = {};
    const repoOptions = options as unknown as RequestOptions;

    if (dto.name !== undefined) {
  const trimmedName = dto.name.trim();

  if (trimmedName !== currentCategory.name) {
    // ✅ FIX: Use ?? instead of ternary
    const targetParentId = dto.parentId ?? currentCategory.parentId;
    
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

    // ✅ Оновлення тільки через репозиторій
    return this.categoryRepo.update(categoryId, updateData, repoOptions);
  }

  async deleteCategory(
    userId: string,
    categoryId: string,
    options?: RequestOptions,
  ): Promise<void> {
    // ✅ Вся логіка видалення винесена в репозиторій
    // Сервіс лише делегує операцію
    await this.categoryRepo.deleteWithHierarchy(userId, categoryId, options);
  }

  async getCategoryTree(userId: string, options?: RequestOptions): Promise<CategoryNode[]> {
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
    options?: RequestOptions,
  ): Promise<Category | null> {
    const category = await this.categoryRepo.findById(categoryId, options);
    if (!category || category.userId !== userId || category.isDeleted) {
      throw new NotFoundError("Category");
    }
    return category;
  }
}