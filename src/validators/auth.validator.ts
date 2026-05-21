import type { RequestHandler } from "express";
import { z } from "zod";

import { loginSchema } from "./loginSchema";
import { registerSchema } from "./registerSchema";

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

const refreshTokenBodySchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  .strict();

export const RegisterRequestValidator = createRequestValidator({ body: registerSchema });
export const LoginRequestValidator = createRequestValidator({ body: loginSchema });
export const RefreshTokenRequestValidator = createRequestValidator({
  body: refreshTokenBodySchema,
});
