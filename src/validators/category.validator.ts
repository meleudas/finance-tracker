import type { RequestHandler } from "express";
import { z } from "zod";

import { CreateCategorySchema } from "../dtos/category/CreateCategory.dto";
import { UpdateCategorySchema } from "../dtos/category/UpdateCategory.dto";
import { idDtoSchema } from "../dtos/common/id.dto";
import { transactionDirectionSchema } from "../dtos/common/schemas";

interface ValidationTarget {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

interface ValidatedRequest {
  validated: Record<string, unknown>;
}

const createRequestValidator = (config: ValidationTarget): RequestHandler => {
  return (req, res, next) => {
    try {
      const validated: Record<string, unknown> = {};
      if (config.body) validated.body = config.body.parse(req.body);
      if (config.params) validated.params = config.params.parse(req.params);
      if (config.query) validated.query = config.query.parse(req.query);

      (req as unknown as ValidatedRequest).validated = validated;
      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues,
        });
      } else {
        next(error);
      }
    }
  };
};

const listCategoriesQuerySchema = z.object({
  kind: transactionDirectionSchema.optional(),
});

export const ListCategoriesRequestValidator = createRequestValidator({
  query: listCategoriesQuerySchema,
});

export const CreateCategoryRequestValidator = createRequestValidator({
  body: CreateCategorySchema,
});

export const GetCategoryRequestValidator = createRequestValidator({
  params: idDtoSchema,
});

export const UpdateCategoryRequestValidator = createRequestValidator({
  params: idDtoSchema,
  body: UpdateCategorySchema,
});

export const DeleteCategoryRequestValidator = createRequestValidator({
  params: idDtoSchema,
});
