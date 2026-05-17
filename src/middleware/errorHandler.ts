import type { ErrorRequestHandler } from "express";
import { AbortError } from "../utils/withAbortSignal";

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === "object" && value !== null;
}

function readStatusCode(err: unknown): number {
  if (!isRecord(err)) {
    return 500;
  }
  const value = err.statusCode;
  return typeof value === "number" ? value : 500;
}

function readCode(err: unknown): string {
  if (!isRecord(err)) {
    return "INTERNAL_ERROR";
  }
  const value = err.code;
  return typeof value === "string" ? value : "INTERNAL_ERROR";
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next): void => {
  if (err instanceof AbortError) {
    if (!res.headersSent) {
      res.status(499).end();
    }
    return;
  }

  const requestId = req.id;
  const statusCode = readStatusCode(err);
  const code = readCode(err);
  const exposeMessage = statusCode !== 500 || process.env.NODE_ENV !== "production";
  const message = exposeMessage && err instanceof Error ? err.message : "Internal server error";

  res.status(statusCode).json({
    error: {
      code,
      message,
      requestId,
    },
  });
};
