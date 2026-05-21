import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { ValidationError } from "../utils/errors/ClientErrors";

const storage = multer.memoryStorage();

export const uploadAttachmentMiddleware = multer({
  storage,
  limits: { fileSize: env.ATTACHMENT_MAX_SIZE_BYTES },
}).single("file");

export function handleMulterError(
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(
        new ValidationError(
          `File size must not exceed ${String(env.ATTACHMENT_MAX_SIZE_BYTES)} bytes`,
        ),
      );
      return;
    }
    next(new ValidationError(err.message));
    return;
  }
  next(err);
}
