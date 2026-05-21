// src/mappers/category.mapper.ts
import type { Category } from "../generated/prisma/client";
import type { CategoryNode } from "../services/interfaces/ICategoryService";
import {
  CategoryResponseSchema,
  type CategoryResponseDto,
} from "../dtos/category/CategoryResponse.dto";
import { toIsoString } from "./prisma-format.utils";

export interface CategoryTreeNodeDto extends CategoryResponseDto {
  children: CategoryTreeNodeDto[];
}

function toCategoryFields(category: Category) {
  return {
    id: category.id,
    name: category.name,
    kind: category.kind,
    parentId: category.parentId,
    createdAt: toIsoString(category.createdAt),
    updatedAt: toIsoString(category.updatedAt),
    deletedAt: category.deletedAt ? toIsoString(category.deletedAt) : null,
    isDeleted: category.isDeleted,
  };
}

/**
 * Мапить одну сутність Category з Prisma у CategoryResponseDto
 */
export function toCategoryResponse(category: Category): CategoryResponseDto {
  return CategoryResponseSchema.parse(toCategoryFields(category));
}

export function toCategoryTreeNode(node: CategoryNode): CategoryTreeNodeDto {
  return {
    ...toCategoryResponse(node),
    children: node.children.map(toCategoryTreeNode),
  };
}

export function toCategoryTreeResponse(nodes: CategoryNode[]): CategoryTreeNodeDto[] {
  return nodes.map(toCategoryTreeNode);
}
