import { AppError } from "./appError";

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super("NOT_FOUND", `${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict: unique constraint violation") {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

export class AbortError extends AppError {
  constructor(message = "Operation was aborted") {
    super("ABORTED", message, 499);
    this.name = "AbortError";
  }
}
