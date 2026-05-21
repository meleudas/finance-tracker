import type { NextFunction, Request, Response } from "express";
import { z, type ZodType } from "zod";
import { ValidationError } from "../utils/errors/ClientErrors";

export function validate(schema: ZodType, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(new ValidationError(result.error.message, z.treeifyError(result.error)));
      return;
    }

    req.validated = {
      ...req.validated,
      [source]: result.data,
    };
    next();
  };
}
