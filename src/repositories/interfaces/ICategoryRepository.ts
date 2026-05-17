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
  //upsert(params: CategoryUpsertParams, options?: RequestOptions): Promise<Category>;
}
