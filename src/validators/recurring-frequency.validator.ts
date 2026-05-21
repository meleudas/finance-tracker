import type { RequestHandler } from "express";
import { z } from "zod";
import { CreateRecurringFrequencySchema } from "../dtos/recurring-frequency/CreateRecurringFrequency.dto";
import { UpdateRecurringFrequencySchema } from "../dtos/recurring-frequency/UpdateRecurringFrequency.dto";
import { recurringFrequencyListQuerySchema } from "../dtos/recurring-frequency/RecurringFrequencyListQuery.dto";
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

export const ListRecurringFrequenciesRequestValidator = createRequestValidator({
  query: recurringFrequencyListQuerySchema,
});

export const CreateRecurringFrequencyRequestValidator = createRequestValidator({
  body: CreateRecurringFrequencySchema,
});

export const GetRecurringFrequencyRequestValidator = createRequestValidator({
  params: idDtoSchema,
});

export const UpdateRecurringFrequencyRequestValidator = createRequestValidator({
  params: idDtoSchema,
  body: UpdateRecurringFrequencySchema,
});

export const DeleteRecurringFrequencyRequestValidator = createRequestValidator({
  params: idDtoSchema,
});
