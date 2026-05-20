// src/validators/category/category.params.schema.ts
import { z } from "zod";
import { cuidSchema } from "../common/id.dto";

export const CategoryIdParamSchema = z
  .object({ categoryId: cuidSchema })
  .strict();

export type CategoryIdParamDto = z.infer<typeof CategoryIdParamSchema>;