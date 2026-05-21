import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../../../src/middleware/validate";
import { ValidationError } from "../../../src/utils/errors/ClientErrors";
import { AppError } from "../../../src/utils/errors/appError";

describe("validate middleware", () => {
  const schema = z.object({
    email: z
      .string()
      .min(1)
      .check(z.email({ error: "Invalid email address" })),
  });

  function run(body: unknown): jest.MockedFunction<NextFunction> {
    const req = { body, validated: undefined } as Request;
    const res = {} as Response;
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    validate(schema)(req, res, next);
    return next;
  }

  it("передає ValidationError у next при невалідному body", () => {
    const next = run({ email: "not-an-email" });

    expect(next).toHaveBeenCalledTimes(1);
    const err: unknown = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(ValidationError);
    expect(err).toBeInstanceOf(AppError);
    expect((err as ValidationError).statusCode).toBe(400);
    expect((err as ValidationError).code).toBe("VALIDATION_ERROR");
  });

  it("записує валідні дані в req.validated і викликає next без помилки", () => {
    const req = { body: { email: "user@example.com" }, validated: undefined } as Request;
    const res = {} as Response;
    const next = jest.fn() as jest.MockedFunction<NextFunction>;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.validated).toEqual({ body: { email: "user@example.com" } });
  });
});
