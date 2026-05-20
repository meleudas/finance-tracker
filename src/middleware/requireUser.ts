import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { unauthorizedError } from "../utils/errors/apiError";

const DEV_USER_HEADER = "x-user-id";

export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.id) {
    next();
    return;
  }

  const headerUserId = req.header(DEV_USER_HEADER);
  if (headerUserId && (env.NODE_ENV === "development" || env.NODE_ENV === "test")) {
    req.user = { id: headerUserId };
    next();
    return;
  }

  if (env.DEV_USER_ID && env.NODE_ENV !== "production") {
    req.user = { id: env.DEV_USER_ID };
    next();
    return;
  }

  next(unauthorizedError());
}
