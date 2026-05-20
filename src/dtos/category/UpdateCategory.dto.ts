// src/validators/category/category.update.schema.ts
import { z } from "zod";
import { CreateCategorySchema } from "./CreateCategory.dto";
import { isNonEmptyPatch, nonEmptyPatchRefineConfig } from "../common/schemas";

export const UpdateCategorySchema = CreateCategorySchema
  .omit({ kind: true })
  .partial()
  .strict()
  .refine(isNonEmptyPatch, nonEmptyPatchRefineConfig);

export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;