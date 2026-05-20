import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors/AppError";
import { AbortError } from "../utils/errors/СlientErrors";
import { InternalError } from "../utils/errors/ServerErrors";

function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next): void => {
  if (err instanceof AbortError || err.name === "AbortError") {
    if (!res.headersSent) {
      res.status(499).end();
    }
    return;
  }

  const requestId = String(req.id);

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