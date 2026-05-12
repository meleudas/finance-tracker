import { AppError } from "./appError";

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

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded, please try again later") {
    super("RATE_LIMIT_ERROR", message, 429);
  }
}
