import type { NextFunction, Request, Response } from "express";
import {
  GetCurrencyByCodeRequestValidator,
  GetCurrencyByIdRequestValidator,
  ListCurrenciesRequestValidator,
  currencyCodeParamSchema,
} from "../../../src/validators/currency.validator";
import { idDtoSchema } from "../../../src/dtos/common/id.dto";

function runValidator(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Partial<Request>,
): { status?: number; next: jest.MockedFunction<NextFunction> } {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  const next = jest.fn() as jest.MockedFunction<NextFunction>;
  middleware(req as Request, res, next);
  return {
    status: (res.status as jest.Mock).mock.calls[0]?.[0] as number | undefined,
    next,
  };
}

describe("currency.validator", () => {
  it("ListCurrenciesRequestValidator викликає next", () => {
    const result = runValidator(ListCurrenciesRequestValidator, {
      body: {},
      params: {},
      query: {},
    });
    expect(result.next).toHaveBeenCalled();
  });

  it("GetCurrencyByCodeRequestValidator: 400 для невалідного code", () => {
    const result = runValidator(GetCurrencyByCodeRequestValidator, {
      params: { code: "INVALID" },
    });
    expect(result.status).toBe(400);
  });

  it("GetCurrencyByIdRequestValidator: 400 для невалідного id", () => {
    const result = runValidator(GetCurrencyByIdRequestValidator, {
      params: { id: "bad" },
    });
    expect(result.status).toBe(400);
  });

  it("прокидає non-ZodError через next (by code)", () => {
    jest.spyOn(currencyCodeParamSchema, "parse").mockImplementation(() => {
      throw new Error("boom");
    });
    const result = runValidator(GetCurrencyByCodeRequestValidator, { params: { code: "USD" } });
    expect(result.next).toHaveBeenCalledWith(expect.any(Error));
    jest.restoreAllMocks();
  });

  it("прокидає non-ZodError через next (by id)", () => {
    jest.spyOn(idDtoSchema, "parse").mockImplementation(() => {
      throw new Error("boom");
    });
    const result = runValidator(GetCurrencyByIdRequestValidator, {
      params: { id: "clg7v9x1k0000qzq8x8x8x8x8" },
    });
    expect(result.next).toHaveBeenCalledWith(expect.any(Error));
    jest.restoreAllMocks();
  });
});
