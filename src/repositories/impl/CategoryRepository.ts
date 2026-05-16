import type { Category } from "../../generated/prisma/client";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import type { ICategoryRepository, CategoryUpsertParams } from "../interfaces/ICategoryRepository";
import type { RequestOptions } from "../interfaces/IBaseRepository";
import { withAbortSignal } from "../../utils/helpers/withAbortSignal";

export class CategoryRepository extends BaseRepository<Category> implements ICategoryRepository {
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

  async upsert(params: CategoryUpsertParams, options?: RequestOptions): Promise<Category> {
    return withAbortSignal(this.prisma.category.upsert(params), options?.signal);
  }
}
