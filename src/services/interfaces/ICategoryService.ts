import type { Category } from "../../generated/prisma/client";
import type { RequestOptions } from "../../repositories/interfaces/IBaseRepository";

export interface CreateCategoryDTO {
  userId: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  parentId?: string | null;
}

export interface UpdateCategoryDTO {
  name?: string;
  parentId?: string | null;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface ICategoryService {
  createCategory(dto: CreateCategoryDTO, options?: RequestOptions): Promise<Category>;
  updateCategory(
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDTO,
    options?: RequestOptions,
  ): Promise<Category>;
  deleteCategory(userId: string, categoryId: string, options?: RequestOptions): Promise<void>;
  getCategoryTree(userId: string, options?: RequestOptions): Promise<CategoryNode[]>;
  getCategoryById(
    userId: string,
    categoryId: string,
    options?: RequestOptions,
  ): Promise<Category | null>;
}
