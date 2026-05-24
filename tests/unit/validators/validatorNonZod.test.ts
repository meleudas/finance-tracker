import type { NextFunction, Request, Response } from "express";
import { CreateAccountSchema } from "../../../src/dtos/account/CreateAccount.dto";
import { CreateAccountRequestValidator } from "../../../src/validators/account.validator";
import { transactionIdParamSchema } from "../../../src/dtos/common/id.dto";
import { UploadAttachmentParamsValidator } from "../../../src/validators/attachments.validator";
import { registerSchema } from "../../../src/validators/registerSchema";
import { RegisterRequestValidator } from "../../../src/validators/auth.validator";
import { CreateBudgetSchema } from "../../../src/dtos/budget/CreateBudget.dto";
import { CreateBudgetRequestValidator } from "../../../src/validators/budget.validator";
import { CreateCategorySchema } from "../../../src/dtos/category/CreateCategory.dto";
import { CreateCategoryRequestValidator } from "../../../src/validators/category.validator";
import { CreateRecurringFrequencySchema } from "../../../src/dtos/recurring-frequency/CreateRecurringFrequency.dto";
import { CreateRecurringFrequencyRequestValidator } from "../../../src/validators/recurring-frequency.validator";
import { CreateRecurringRuleSchema } from "../../../src/dtos/recurring-rule/CreateRecurringRule.dto";
import { CreateRecurringRuleRequestValidator } from "../../../src/validators/recurring-rule.validator";
import { createReportJobSchema } from "../../../src/dtos/report/CreateReportJob.dto";
import { CreateReportJobRequestValidator } from "../../../src/validators/reports.validator";
import { CreateTransactionSchema } from "../../../src/dtos/transaction/CreateTransaction.dto";
import { CreateTransactionRequestValidator } from "../../../src/validators/transactions.validator";
import { CreateTransferSchema } from "../../../src/dtos/transfer/CreateTransfer.dto";
import { CreateTransferRequestValidator } from "../../../src/validators/transfers.validator";

function runValidator(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Partial<Request>,
): jest.MockedFunction<NextFunction> {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
  const next = jest.fn() as jest.MockedFunction<NextFunction>;
  middleware(req as Request, res, next);
  return next;
}

describe("validators non-ZodError forwarding", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const cases: {
    name: string;
    schema: { parse: (v: unknown) => unknown };
    validator: (req: Request, res: Response, next: NextFunction) => void;
    req: Partial<Request>;
  }[] = [
    {
      name: "account",
      schema: CreateAccountSchema,
      validator: CreateAccountRequestValidator,
      req: { body: {}, params: {}, query: {} },
    },
    {
      name: "attachments",
      schema: transactionIdParamSchema,
      validator: UploadAttachmentParamsValidator,
      req: { params: { transactionId: "clg7v9x1k0000qzq8x8x8x8x8" } },
    },
    {
      name: "auth",
      schema: registerSchema,
      validator: RegisterRequestValidator,
      req: { body: {} },
    },
    {
      name: "budget",
      schema: CreateBudgetSchema,
      validator: CreateBudgetRequestValidator,
      req: { body: {} },
    },
    {
      name: "category",
      schema: CreateCategorySchema,
      validator: CreateCategoryRequestValidator,
      req: { body: {} },
    },
    {
      name: "recurring-frequency",
      schema: CreateRecurringFrequencySchema,
      validator: CreateRecurringFrequencyRequestValidator,
      req: { body: {} },
    },
    {
      name: "recurring-rule",
      schema: CreateRecurringRuleSchema,
      validator: CreateRecurringRuleRequestValidator,
      req: { body: {} },
    },
    {
      name: "reports",
      schema: createReportJobSchema,
      validator: CreateReportJobRequestValidator,
      req: { body: {} },
    },
    {
      name: "transactions",
      schema: CreateTransactionSchema,
      validator: CreateTransactionRequestValidator,
      req: { body: {} },
    },
    {
      name: "transfers",
      schema: CreateTransferSchema,
      validator: CreateTransferRequestValidator,
      req: { body: {} },
    },
  ];

  it.each(cases)("$name forwards non-ZodError", ({ schema, validator, req }) => {
    jest.spyOn(schema, "parse").mockImplementation(() => {
      throw new Error("boom");
    });
    const next = runValidator(validator, req);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
