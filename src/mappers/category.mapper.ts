// src/mappers/category.mapper.ts
import type { Category } from "../generated/prisma/client";
import {
  CategoryResponseSchema,
  type CategoryResponseDto,
} from "../dtos/category/CategoryResponse.dto";
import { toIsoString } from "./prisma-format.utils";

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

/**
 * Мапить масив сутностей Category у список відповідей
 */
export function toCategoryResponseList(categories: Category[]): CategoryResponseDto[] {
  return categories.map((category) => toCategoryResponse(category));
}

/**
 * Мапить результат запиту з пагінацією у стандартну відповідь списку
 * @param categories - масив сутностей Category з Prisma
 * @param page - поточна сторінка
 * @param limit - ліміт на сторінку
 * @param total - загальна кількість записів
 */
export function toCategoryListResponse(
  categories: Category[],
  page: number,
  limit: number,
  total: number,
) {
  return {
    data: toCategoryResponseList(categories),
    meta: {
      page,
      limit,
      total,
      hasNextPage: page * limit < total,
    },
  };
}