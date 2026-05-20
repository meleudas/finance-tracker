import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors/appError";
import { AbortError } from "../utils/errors/ClientErrors";
import { InternalError } from "../utils/errors/serverErrors";

function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

function isAbortError(err: unknown): boolean {
  return err instanceof AbortError || (err instanceof Error && err.name === "AbortError");
}

function requestIdFrom(req: { id?: unknown }): string {
  if (typeof req.id === "string" && req.id.length > 0) {
    return req.id;
  }
  return "unknown";
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next): void => {
  if (isAbortError(err)) {
    if (!res.headersSent) {
      res.status(499).end();
    }
    return;
  }

  const requestId = requestIdFrom(req);

  const appError = isAppError(err) ? err : new InternalError();

  const isProduction = process.env.NODE_ENV === "production";
  const isClientError = appError.statusCode < 500;
  const shouldExposeMessage = !isProduction || isClientError;

  const message = shouldExposeMessage ? appError.message : "Internal server error";

  const responseBody: {
    error: {
      code: string;
      message: string;
      requestId: string;
      details?: unknown;
    };
  } = {
    error: {
      code: appError.code,
      message,
      requestId,
    },
  };

  if (appError.details && shouldExposeMessage) {
    responseBody.error.details = appError.details;
  }

  res.status(appError.statusCode).json(responseBody);
};
