import type { RequestHandler } from "express";
import { z } from "zod";

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

export const currencyCodeParamSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Invalid ISO 4217 currency code (e.g., UAH, USD, EUR)"),
});

export const ListCurrenciesRequestValidator = createRequestValidator({});

export const GetCurrencyByCodeRequestValidator = createRequestValidator({
  params: currencyCodeParamSchema,
});

export const GetCurrencyByIdRequestValidator = createRequestValidator({
  params: idDtoSchema,
});
