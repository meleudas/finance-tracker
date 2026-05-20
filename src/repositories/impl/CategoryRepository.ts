import type { Category } from "../../generated/prisma/client";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import type { ICategoryRepository } from "../interfaces/ICategoryRepository";
import type { RequestOptions } from "../interfaces/IBaseRepository";
import { withAbortSignal } from "../../utils/helpers/withAbortSignal";
import { NotFoundError, ConflictError } from "../../utils/errors/ClientErrors";

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

  async existsWithSameName(
    userId: string,
    name: string,
    parentId: string | null,
    kind: string,
    excludeId?: string,
    options?: RequestOptions,
  ): Promise<boolean> {
    const count = await withAbortSignal(
      this.prisma.category.count({
        where: {
          userId,
          isDeleted: false,
          name: { equals: name.trim(), mode: "insensitive" },
          parentId,
          kind: kind as Category["kind"],
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      }),
      options?.signal,
    );
    return count > 0;
  }

  async hasActiveTransactions(categoryIds: string[], options?: RequestOptions): Promise<boolean> {
    if (categoryIds.length === 0) {
      return false;
    }

    const count = await withAbortSignal(
      this.prisma.transaction.count({
        where: {
          categoryId: { in: categoryIds },
          isDeleted: false,
        },
      }),
      options?.signal,
    );

    return count > 0;
  }

  async deleteWithHierarchy(
    userId: string,
    categoryId: string,
    options?: RequestOptions,
  ): Promise<void> {
    const category = await this.findById(categoryId, options);

    if (!category || category.isDeleted || category.userId !== userId) {
      throw new NotFoundError("Category");
    }

    const ids = await this.collectSubtreeIds(categoryId, options);

    if (await this.hasActiveTransactions(ids, options)) {
      throw new ConflictError(
        "Cannot delete category with active financial history. Reassign transactions first.",
      );
    }

    const deletedAt = new Date();

    await withAbortSignal(
      this.prisma.$transaction(async (tx) => {
        await tx.budget.updateMany({
          where: { categoryId: { in: ids } },
          data: { categoryId: null },
        });

        await tx.category.updateMany({
          where: { id: { in: ids }, userId },
          data: { isDeleted: true, deletedAt },
        });
      }),
      options?.signal,
    );
  }

  private async collectSubtreeIds(rootId: string, options?: RequestOptions): Promise<string[]> {
    const ids: string[] = [rootId];
    const queue: string[] = [rootId];

    while (queue.length > 0) {
      const parentId = queue.shift();
      if (parentId === undefined) {
        break;
      }
      const children = await this.findSubCategories(parentId, options);

      for (const child of children) {
        ids.push(child.id);
        queue.push(child.id);
      }
    }

    return ids;
  }
}
