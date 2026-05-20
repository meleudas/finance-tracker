import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { validationError } from "../utils/errors/apiError";

export function validate(schema: ZodType, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(validationError(result.error.message));
      return;
    }

    req.validated = {
      ...req.validated,
      [source]: result.data,
    };
    next();
  };
}
