import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { CreateCategoryRequestValidator } from "../../../src/validators/category.validator";
import { CreateBudgetRequestValidator } from "../../../src/validators/budget.validator";
import {
  LoginRequestValidator,
  RefreshTokenRequestValidator,
} from "../../../src/validators/auth.validator";
import { CreateTransactionRequestValidator } from "../../../src/validators/transactions.validator";
import { GetTransferRequestValidator } from "../../../src/validators/transfers.validator";
import { CreateRecurringRuleRequestValidator } from "../../../src/validators/recurring-rule.validator";
import { CreateRecurringFrequencyRequestValidator } from "../../../src/validators/recurring-frequency.validator";

function runValidator(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Partial<Request>,
): { status?: number; body?: unknown; next: jest.MockedFunction<NextFunction> } {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  const next = jest.fn() as jest.MockedFunction<NextFunction>;
  middleware(req as Request, res, next);
  return {
    status: (res.status as jest.Mock).mock.calls[0]?.[0] as number | undefined,
    body: (res.json as jest.Mock).mock.calls[0]?.[0],
    next,
  };
}

describe("request validators — error paths", () => {
  it("CreateCategoryRequestValidator: 400 для невалідного body", () => {
    const result = runValidator(CreateCategoryRequestValidator, {
      body: { name: "" },
      params: {},
      query: {},
    });

    expect(result.status).toBe(400);
    expect(result.body).toEqual(
      expect.objectContaining({ error: "Validation failed", details: expect.any(Array) }),
    );
    expect(result.next).not.toHaveBeenCalled();
  });

  it("CreateBudgetRequestValidator: 400 для невалідного body", () => {
    const result = runValidator(CreateBudgetRequestValidator, {
      body: {},
      params: {},
      query: {},
    });

    expect(result.status).toBe(400);
    expect(result.next).not.toHaveBeenCalled();
  });

  it("RefreshTokenRequestValidator: приймає порожнє body (cookie flow)", () => {
    const result = runValidator(RefreshTokenRequestValidator, {
      body: {},
      params: {},
      query: {},
    });
    expect(result.next).toHaveBeenCalled();
  });

  it("LoginRequestValidator: 400 для невалідного email", () => {
    const result = runValidator(LoginRequestValidator, {
      body: { email: "bad", password: "short" },
      params: {},
      query: {},
    });

    expect(result.status).toBe(400);
  });

  it("CreateTransactionRequestValidator: 400 для невалідного cuid", () => {
    const result = runValidator(CreateTransactionRequestValidator, {
      body: {
        accountId: "not-cuid",
        currencyId: "not-cuid",
        amount: 10,
        direction: "EXPENSE",
        occurredAt: "2026-05-01T12:00:00.000Z",
      },
      params: {},
      query: {},
    });

    expect(result.status).toBe(400);
  });

  it("GetTransferRequestValidator: 400 для невалідного id", () => {
    const result = runValidator(GetTransferRequestValidator, {
      body: {},
      params: { id: "invalid" },
      query: {},
    });

    expect(result.status).toBe(400);
  });

  it("CreateRecurringRuleRequestValidator: 400 для порожнього body", () => {
    const result = runValidator(CreateRecurringRuleRequestValidator, {
      body: {},
      params: {},
      query: {},
    });

    expect(result.status).toBe(400);
  });

  it("CreateRecurringFrequencyRequestValidator: 400 для невалідного every", () => {
    const result = runValidator(CreateRecurringFrequencyRequestValidator, {
      body: { name: "Weekly", every: 0, unit: "WEEK" },
      params: {},
      query: {},
    });

    expect(result.status).toBe(400);
  });

  it("прокидає non-ZodError через next", () => {
    const brokenSchema = {
      parse: () => {
        throw new Error("unexpected");
      },
    } as unknown as z.ZodType;

    const middleware = (req: Request, res: Response, next: NextFunction): void => {
      try {
        brokenSchema.parse(req.body);
        next();
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ error: "Validation failed", details: error.issues });
        } else {
          next(error);
        }
      }
    };

    const result = runValidator(middleware, { body: {}, params: {}, query: {} });
    expect(result.next).toHaveBeenCalledWith(expect.any(Error));
  });
});
