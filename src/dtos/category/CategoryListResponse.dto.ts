// src/validators/category/category.list.response.schema.ts
import { z } from "zod";
import { CategoryResponseSchema } from "./CategoryResponse.dto";
import { paginationQuerySchema } from "../common/pagination.dto";

export const CategoryListResponseSchema = z
  .object({
    data: z.array(CategoryResponseSchema),
    meta: z.object({
      page: paginationQuerySchema.shape.page,
      limit: paginationQuerySchema.shape.limit,
      total: z.number().int().nonnegative(),
      hasNextPage: z.boolean(),
    }),
  })
  .strict();

export type CategoryListResponseDto = z.infer<typeof CategoryListResponseSchema>;