import { AppError } from "./appError";

export class InternalError extends AppError {
  constructor(message = "An unexpected error occurred") {
    super("INTERNAL_ERROR", message, 500);
  }
}
