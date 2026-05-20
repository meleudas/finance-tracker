import multer from "multer";
import { env } from "../config/env";
import { validationError } from "../utils/errors/apiError";

const storage = multer.memoryStorage();

export const uploadAttachmentMiddleware = multer({
  storage,
  limits: { fileSize: env.ATTACHMENT_MAX_SIZE_BYTES },
}).single("file");

export function handleMulterError(
  err: unknown,
  _req: unknown,
  _res: unknown,
  next: (err?: unknown) => void,
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(
        validationError(`File size must not exceed ${String(env.ATTACHMENT_MAX_SIZE_BYTES)} bytes`),
      );
      return;
    }
    next(validationError(err.message));
    return;
  }
  next(err);
}
