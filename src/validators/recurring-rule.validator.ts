import type { RequestHandler } from "express";
import { z } from "zod";
import { CreateRecurringRuleSchema } from "../dtos/recurring-rule/CreateRecurringRule.dto";
import { UpdateRecurringRuleSchema } from "../dtos/recurring-rule/UpdateRecurringRule.dto";
import { recurringRuleListQuerySchema } from "../dtos/recurring-rule/RecurringRuleListQuery.dto";
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

export const ListRecurringRulesRequestValidator = createRequestValidator({
  query: recurringRuleListQuerySchema,
});

export const CreateRecurringRuleRequestValidator = createRequestValidator({
  body: CreateRecurringRuleSchema,
});

export const GetRecurringRuleRequestValidator = createRequestValidator({
  params: idDtoSchema,
});

export const UpdateRecurringRuleRequestValidator = createRequestValidator({
  params: idDtoSchema,
  body: UpdateRecurringRuleSchema,
});

export const DeleteRecurringRuleRequestValidator = createRequestValidator({
  params: idDtoSchema,
});
