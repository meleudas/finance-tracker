import type { Category } from "../../generated/prisma/client";
import type { ICategoryRepository } from "../../repositories/interfaces/ICategoryRepository";
import type { ICategoryService, CategoryNode } from "../interfaces/ICategoryService";
import { NotFoundError, ValidationError, ConflictError } from "../../utils/errors/ClientErrors";
import { ForbiddenError } from "../../utils/errors/securityErrors";
import type { CreateCategoryDto } from "../../dtos/category/CreateCategory.dto";
import type { UpdateCategoryDto } from "../../dtos/category/UpdateCategory.dto";
import type { ICache } from "../../redis";
import { env } from "../../config/env";
import type { ServiceContext } from "../serviceContext";
import { repoOptions, withServiceSignal } from "../serviceContext";

const CATEGORY_TREE_CACHE_PREFIX = "category:tree";
const CATEGORY_ITEM_CACHE_PREFIX = "category:item";

function buildCategoryTreeCacheKey(userId: string): string {
  return `${CATEGORY_TREE_CACHE_PREFIX}:${userId}`;
}

function buildCategoryItemCacheKey(userId: string, categoryId: string): string {
  return `${CATEGORY_ITEM_CACHE_PREFIX}:${userId}:${categoryId}`;
}

export class CategoryService implements ICategoryService {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly cache: ICache,
  ) {}

  async createCategory(
    userId: string,
    dto: CreateCategoryDto,
    ctx?: ServiceContext,
  ): Promise<Category> {
    const options = repoOptions(ctx);

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

    const isDuplicate = await this.categoryRepo.existsWithSameName(
      userId,
      dto.name,
      dto.parentId ?? null,
      dto.kind,
      undefined,
      options,
    );

    if (isDuplicate) {
      throw new ConflictError("Category with this name already exists at this level");
    }

    const created = await this.categoryRepo.create(
      {
        userId,
        name: dto.name.trim(),
        kind: dto.kind,
        parentId: dto.parentId ?? null,
      },
      options,
    );
    await this.invalidateUserCategoryCache(userId, undefined, ctx);
    return created;
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
    ctx?: ServiceContext,
  ): Promise<Category> {
    const options = repoOptions(ctx);
    const currentCategory = await this.categoryRepo.findById(categoryId, options);

    if (!currentCategory || currentCategory.isDeleted || currentCategory.userId !== userId) {
      throw new NotFoundError("Category");
    }

    const updateData: { name?: string; parentId?: string | null } = {};
    const targetParentId = dto.parentId !== undefined ? dto.parentId : currentCategory.parentId;
    const targetName = dto.name !== undefined ? dto.name.trim() : currentCategory.name;

    if (dto.parentId !== undefined) {
      if (dto.parentId === categoryId) {
        throw new ValidationError("Category cannot be its own parent");
      }

      if (dto.parentId !== null) {
        const parent = await this.categoryRepo.findById(dto.parentId, options);

        if (!parent || parent.isDeleted) {
          throw new NotFoundError("Parent category");
        }
        if (parent.userId !== userId) {
          throw new ForbiddenError("You do not have permission to use this parent category");
        }
        if (parent.kind !== currentCategory.kind) {
          throw new ValidationError("Child category must have the same kind as parent");
        }

        const descendantIds = await this.collectDescendantIds(categoryId, options);
        if (descendantIds.includes(dto.parentId)) {
          throw new ValidationError("Cannot move category under its own descendant");
        }
      }

      updateData.parentId = dto.parentId;
    }

    if (dto.name !== undefined && dto.name.trim() !== currentCategory.name) {
      updateData.name = dto.name.trim();
    }

    const nameChanged = updateData.name !== undefined;
    const parentChanged = dto.parentId !== undefined;

    if (nameChanged || parentChanged) {
      const isDuplicate = await this.categoryRepo.existsWithSameName(
        userId,
        targetName,
        targetParentId,
        currentCategory.kind,
        categoryId,
        options,
      );

      if (isDuplicate) {
        throw new ConflictError("Category with this name already exists at this level");
      }
    }

    if (Object.keys(updateData).length === 0) {
      return currentCategory;
    }

    const updated = await this.categoryRepo.update(categoryId, updateData, options);
    await this.invalidateUserCategoryCache(userId, categoryId, ctx);
    return updated;
  }

  async deleteCategory(userId: string, categoryId: string, ctx?: ServiceContext): Promise<void> {
    const options = repoOptions(ctx);
    await this.categoryRepo.deleteWithHierarchy(userId, categoryId, options);
    await this.invalidateUserCategoryCache(userId, categoryId, ctx);
  }

  async getCategoryTree(userId: string, ctx?: ServiceContext): Promise<CategoryNode[]> {
    const options = repoOptions(ctx);
    const cacheKey = buildCategoryTreeCacheKey(userId);

    const cached = await withServiceSignal(this.cache.getJson<CategoryNode[]>(cacheKey), ctx);
    if (cached) {
      return cached;
    }

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

    await withServiceSignal(
      this.cache.setJson(cacheKey, rootNodes, env.CATEGORY_TREE_CACHE_TTL_SECONDS),
      ctx,
    );
    return rootNodes;
  }

  async getCategoryById(
    userId: string,
    categoryId: string,
    ctx?: ServiceContext,
  ): Promise<Category> {
    const options = repoOptions(ctx);
    const cacheKey = buildCategoryItemCacheKey(userId, categoryId);

    const cached = await withServiceSignal(this.cache.getJson<Category>(cacheKey), ctx);
    if (cached) {
      return cached;
    }

    const category = await this.categoryRepo.findById(categoryId, options);
    const categoryMissingOrInvalid = category?.userId !== userId || category.isDeleted;
    if (categoryMissingOrInvalid) {
      throw new NotFoundError("Category");
    }

    await withServiceSignal(
      this.cache.setJson(cacheKey, category, env.CATEGORY_ITEM_CACHE_TTL_SECONDS),
      ctx,
    );
    return category;
  }

  private async invalidateUserCategoryCache(
    userId: string,
    categoryId?: string,
    ctx?: ServiceContext,
  ): Promise<void> {
    await withServiceSignal(this.cache.delete(buildCategoryTreeCacheKey(userId)), ctx);

    const itemKeys = await withServiceSignal(
      this.cache.keys(`${CATEGORY_ITEM_CACHE_PREFIX}:${userId}:*`),
      ctx,
    );
    await Promise.all(itemKeys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));

    if (categoryId) {
      await withServiceSignal(
        this.cache.delete(buildCategoryItemCacheKey(userId, categoryId)),
        ctx,
      );
    }
  }

  private async collectDescendantIds(
    rootId: string,
    options: ReturnType<typeof repoOptions>,
  ): Promise<string[]> {
    const ids: string[] = [];
    const queue: string[] = [rootId];

    while (queue.length > 0) {
      const parentId = queue.shift();
      if (parentId === undefined) {
        break;
      }
      const children = await this.categoryRepo.findSubCategories(parentId, options);

      for (const child of children) {
        ids.push(child.id);
        queue.push(child.id);
      }
    }

    return ids;
  }
}
