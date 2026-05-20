// src/services/interfaces/ICategoryService.ts
import type { Category } from "../../generated/prisma/client";
import type { CreateCategoryDto } from "../../dtos/category/CreateCategory.dto";
import type { UpdateCategoryDto } from "../../dtos/category/UpdateCategory.dto";
import type { ServiceContext } from "../serviceContext";

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface ICategoryService {
  createCategory(userId: string, dto: CreateCategoryDto, ctx?: ServiceContext): Promise<Category>;

  updateCategory(
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
    ctx?: ServiceContext,
  ): Promise<Category>;

  deleteCategory(userId: string, categoryId: string, ctx?: ServiceContext): Promise<void>;

  getCategoryTree(userId: string, ctx?: ServiceContext): Promise<CategoryNode[]>;
  getCategoryById(userId: string, categoryId: string, ctx?: ServiceContext): Promise<Category>;
}
