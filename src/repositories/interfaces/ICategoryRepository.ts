import type { Category, Prisma } from "../../generated/prisma/client";
import type { IBaseRepository, RequestOptions } from "./IBaseRepository";

export interface CategoryUpsertParams {
  where: Prisma.CategoryWhereUniqueInput;
  create: {
    id: string;
    userId: string;
    parentId?: string | null;
    name: string;
    kind: "INCOME" | "EXPENSE";
  };
  update: {
    parentId?: string | null;
    name?: string;
    kind?: "INCOME" | "EXPENSE";
    isDeleted?: boolean;
    deletedAt?: Date | null;
  };
}

export interface ICategoryRepository extends IBaseRepository<Category> {
  findByUserId(userId: string, options?: RequestOptions): Promise<Category[]>;
  findSubCategories(parentId: string, options?: RequestOptions): Promise<Category[]>;

  // ✅ Нові методи для складних операцій (видалення з транзакцією)
  deleteWithHierarchy(userId: string, categoryId: string, options?: RequestOptions): Promise<void>;

  // ✅ Методи для перевірок, які раніше були в сервісі
  existsWithSameName(
    userId: string,
    name: string,
    parentId: string | null,
    kind: string,
    excludeId?: string,
    options?: RequestOptions,
  ): Promise<boolean>;
  hasActiveTransactions(categoryIds: string[], options?: RequestOptions): Promise<boolean>;
}
