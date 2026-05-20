// src/validators/category/category.query.schema.ts
import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.dto";
import { transactionDirectionSchema } from "../common/schemas";
import { cuidSchema } from "../common/id.dto";

export const CategoryQuerySchema = paginationQuerySchema
  .extend({
    kind: transactionDirectionSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
    parentId: cuidSchema.nullable().optional(),
  })
  .strict();

export type CategoryQueryDto = z.infer<typeof CategoryQuerySchema>;