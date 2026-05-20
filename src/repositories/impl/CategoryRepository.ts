import type { Category } from "../../generated/prisma/client";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import type { ICategoryRepository } from "../interfaces/ICategoryRepository";
import type { RequestOptions } from "../interfaces/IBaseRepository";
import { withAbortSignal } from "../../utils/helpers/WithAbortSignal";

export class CategoryRepository extends BaseRepository<Category> implements ICategoryRepository {
  deleteWithHierarchy(
    _userId: string,
    _categoryId: string,
    _options?: RequestOptions,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  existsWithSameName(
    _userId: string,
    _name: string,
    _parentId: string | null,
    _kind: string,
    _excludeId?: string,
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  hasActiveTransactions(_categoryIds: string[], _options?: RequestOptions): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  protected get delegate(): PrismaDelegate {
    return this.prisma.category as unknown as PrismaDelegate;
  }

  async findByUserId(userId: string, options?: RequestOptions): Promise<Category[]> {
    return withAbortSignal(
      this.prisma.category.findMany({
        where: { userId, isDeleted: false },
        orderBy: { name: "asc" },
      }),
      options?.signal,
    );
  }

  async findSubCategories(parentId: string, options?: RequestOptions): Promise<Category[]> {
    return withAbortSignal(
      this.prisma.category.findMany({
        where: { parentId, isDeleted: false },
      }),
      options?.signal,
    );
  }

  //async upsert(params: CategoryUpsertParams, options?: RequestOptions): Promise<Category> {
  //return withAbortSignal(this.prisma.category.upsert(params), options?.signal);
  //}
}
