export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Missing or invalid token") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to access this resource") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super("NOT_FOUND", `${resource} not found or access denied`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict: unique constraint violation") {
    super("CONFLICT", message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded, please try again later") {
    super("RATE_LIMIT_ERROR", message, 429);
  }
}

export class InternalError extends AppError {
  constructor(message = "An unexpected error occurred") {
    super("INTERNAL_ERROR", message, 500);
  }
}
