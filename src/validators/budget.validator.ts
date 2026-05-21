import type { RequestHandler } from "express";
import { z } from "zod";

import { CreateBudgetSchema } from "../dtos/budget/CreateBudget.dto";
import { UpdateBudgetSchema } from "../dtos/budget/UpdateBudget.dto";
import { UpdateBudgetLimitSchema } from "../dtos/budget/UpdateBudgetLimit.dto";
import { BudgetQuerySchema } from "../dtos/budget/BudgetQuery.dto";
import { idDtoSchema } from "../dtos/common/id.dto";

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

const budgetProgressQuerySchema = z.object({
  date: z.coerce.date({ message: "Invalid date format. Use YYYY-MM-DD" }).optional(),
});

export const ListBudgetsRequestValidator = createRequestValidator({
  query: BudgetQuerySchema,
});

export const CreateBudgetRequestValidator = createRequestValidator({
  body: CreateBudgetSchema,
});

export const GetBudgetRequestValidator = createRequestValidator({
  params: idDtoSchema,
});

export const UpdateBudgetRequestValidator = createRequestValidator({
  params: idDtoSchema,
  body: UpdateBudgetSchema,
});

export const UpdateBudgetLimitRequestValidator = createRequestValidator({
  params: idDtoSchema,
  body: UpdateBudgetLimitSchema,
});

export const DeleteBudgetRequestValidator = createRequestValidator({
  params: idDtoSchema,
});

export const BudgetProgressQueryValidator = createRequestValidator({
  query: budgetProgressQuerySchema,
});
