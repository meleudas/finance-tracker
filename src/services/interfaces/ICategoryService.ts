// src/services/interfaces/ICategoryService.ts
import type { Category } from "../../generated/prisma/client";
import type { CreateCategoryDto } from "../../dtos/category/CreateCategory.dto";
import type { UpdateCategoryDto } from "../../dtos/category/UpdateCategory.dto";
import type { RequestOptions } from "../../repositories/interfaces/IBaseRepository";

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface ICategoryService {
  // 🔥 userId передається окремо
  createCategory(
    userId: string,
    dto: CreateCategoryDto,
    options?: RequestOptions,
  ): Promise<Category>;

  updateCategory(
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
    options?: RequestOptions,
  ): Promise<Category>;

  deleteCategory(
    userId: string,
    categoryId: string,
    options?: RequestOptions,
  ): Promise<void>;

  getCategoryTree(userId: string, options?: RequestOptions): Promise<CategoryNode[]>;
  getCategoryById(
    userId: string,
    categoryId: string,
    options?: RequestOptions,
  ): Promise<Category | null>;
}