import { AppError } from "./appError";

export class InternalError extends AppError {
  constructor(message = "An unexpected error occurred") {
    super("INTERNAL_ERROR", message, 500);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable") {
    super("SERVICE_UNAVAILABLE", message, 503);
  }
}
