import { AppError } from "../utils/errors/appError";
import { ServiceUnavailableError } from "../utils/errors/serverErrors";

export function rethrowStorageError(err: unknown): never {
  if (err instanceof AppError) {
    throw err;
  }
  throw new ServiceUnavailableError("Object storage is unavailable");
}
