import { AppError } from "./AppError";

export class UnauthorizedError extends AppError {
  constructor(message = "Invalid credentials") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to access this resource") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded, please try again later") {
    super("RATE_LIMIT_ERROR", message, 429);
    this.name = "RateLimitError";
  }
}
