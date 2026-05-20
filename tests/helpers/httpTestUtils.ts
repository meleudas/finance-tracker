import type { ErrorRequestHandler, RequestHandler } from "express";
import type { Response } from "supertest";
import { AppError } from "../../src/utils/errors/appError";

export const TEST_REQUEST_ID = "test-request-id";

export const assignTestRequestId: RequestHandler = (req, _res, next) => {
  req.id = TEST_REQUEST_ID;
  next();
};

export function createTestAppErrorHandler(): ErrorRequestHandler {
  return (err, _req, res, _next): void => {
    const isAppError = err instanceof AppError;
    const statusCode = isAppError ? err.statusCode : 500;
    const code = isAppError ? err.code : "INTERNAL_ERROR";
    const message = isAppError ? err.message : "Internal server error";
    res.status(statusCode).json({
      error: { code, message, requestId: TEST_REQUEST_ID },
    });
  };
}

export interface ApiErrorEnvelope {
  error: { code: string; message: string; requestId: string };
}

export interface ApiDataEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export function getResponseData(res: Response): unknown {
  const body = res.body as ApiDataEnvelope<unknown>;
  return body.data;
}

export function getResponseError(res: Response): ApiErrorEnvelope["error"] {
  const body = res.body as ApiErrorEnvelope;
  return body.error;
}

export function getResponseMeta(res: Response): Record<string, unknown> {
  const body = res.body as ApiDataEnvelope<unknown>;
  return body.meta ?? {};
}

export function formatSetCookieHeader(header: string | string[] | undefined): string {
  if (Array.isArray(header)) {
    return header.join(";");
  }
  return header ?? "";
}
