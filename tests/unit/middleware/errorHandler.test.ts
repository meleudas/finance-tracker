import type { Request, Response } from "express";
import { errorHandler } from "../../../src/middleware/errorHandler";
import { ValidationError, AbortError } from "../../../src/utils/errors/ClientErrors";
import { InternalError } from "../../../src/utils/errors/serverErrors";

jest.mock("../../../src/config/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { logger } from "../../../src/config/logger";

function mockRes(): Response {
  const res = {
    headersSent: false,
    statusCode: 200,
    status: jest.fn(function (this: Response, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(),
  };
  return res as unknown as Response;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    id: "rid",
    log: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
    ...overrides,
  } as unknown as Request;
}

describe("errorHandler", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
  });

  it("handles AbortError with 499", () => {
    const req = mockReq({ id: "req-1" });
    const res = mockRes();
    errorHandler(new AbortError(), req, res, next);
    expect(res.status).toHaveBeenCalledWith(499);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "ABORTED" }) }),
    );
  });

  it("handles native AbortError by name", () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    const res = mockRes();
    errorHandler(err, mockReq({ id: "" }), res, next);
    expect(res.status).toHaveBeenCalledWith(499);
  });

  it("skips abort response when headers already sent", () => {
    const res = mockRes();
    res.headersSent = true;
    errorHandler(new AbortError(), mockReq({ id: "x" }), res, next);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("maps AppError to response with details", () => {
    const res = mockRes();
    const err = new ValidationError("bad", { field: "x" });
    errorHandler(err, mockReq({ id: "rid" }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "VALIDATION_ERROR", details: { field: "x" } }),
      }),
    );
  });

  it("masks unknown errors in production", () => {
    process.env.NODE_ENV = "production";
    const res = mockRes();
    errorHandler(new Error("secret"), mockReq({ id: "rid" }), res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: "Internal server error",
          code: "INTERNAL_ERROR",
        }),
      }),
    );
  });

  it("logs unhandled 5xx via req.log in non-production", () => {
    process.env.NODE_ENV = "development";
    const req = mockReq({ id: "rid" });
    errorHandler(new Error("x"), req, mockRes(), next);
    expect(req.log?.error).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs 5xx in production via req.log", () => {
    process.env.NODE_ENV = "production";
    const req = mockReq({ id: "rid" });
    errorHandler(new Error("secret"), req, mockRes(), next);
    expect(req.log?.error).toHaveBeenCalled();
  });

  it("logs AppError 5xx via req.log", () => {
    const req = mockReq({ id: "rid" });
    errorHandler(new InternalError("db down"), req, mockRes(), next);
    expect(req.log?.error).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        code: "INTERNAL_ERROR",
        handled: true,
      }),
      "Request failed with server error",
    );
  });

  it("does not log 4xx AppError", () => {
    const req = mockReq({ id: "rid" });
    errorHandler(new ValidationError("bad"), req, mockRes(), next);
    expect(req.log?.error).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("falls back to global logger when req.log is missing", () => {
    process.env.NODE_ENV = "production";
    errorHandler(new Error("x"), { id: "rid" } as Request, mockRes(), next);
    expect(logger.error).toHaveBeenCalled();
  });

  it("uses unknown request id when missing", () => {
    const res = mockRes();
    errorHandler(new InternalError(), mockReq({ id: undefined }), res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ requestId: "unknown" }) }),
    );
  });
});
