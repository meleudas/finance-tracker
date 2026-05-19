import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { validationError } from "../utils/apiError";

export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body as unknown,
      query: req.query as unknown,
      params: req.params as unknown,
    });

    if (!result.success) {
      next(validationError(result.error.message));
      return;
    }

    req.validated = result.data as {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    };
    next();
  };
}
