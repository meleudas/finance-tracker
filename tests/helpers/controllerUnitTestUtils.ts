import express from "express";
import { AppError } from "../../src/utils/errors/appError";

export function createControllerTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.id = "test-request-id";
    next();
  });
  return app;
}

export function mountControllerErrorHandler(app: express.Application): void {
  app.use(
    (
      err: Error | AppError,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const isAppError = err instanceof AppError;
      const statusCode = isAppError ? err.statusCode : 500;
      const code = isAppError ? err.code : "INTERNAL_ERROR";
      const message = isAppError ? err.message : "Internal server error";
      res.status(statusCode).json({
        error: { code, message, requestId: String(req.id ?? "test") },
      });
    },
  );
}

export const TEST_USER_ID = "clg7v9x1k0000qzq8x8x8x8x8";
