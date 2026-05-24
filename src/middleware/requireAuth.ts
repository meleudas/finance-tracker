import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { getRequestLogger } from "../http/requestLog";
import { getServiceContext } from "../http/requestContext";
import type { IAuthService } from "../services/interfaces/IAuthService";
import { UnauthorizedError } from "../utils/errors/securityErrors";

const DEV_USER_HEADER = "x-user-id";

function tryDevUserFallback(req: Request): boolean {
  if (env.NODE_ENV === "production") {
    return false;
  }

  const headerUserId = req.header(DEV_USER_HEADER);
  if (headerUserId) {
    req.user = { email: "", id: headerUserId };
    return true;
  }

  if (env.DEV_USER_ID) {
    req.user = { email: "", id: env.DEV_USER_ID };
    return true;
  }

  return false;
}

function rejectUnauthorized(req: Request, next: NextFunction, reason: string): void {
  getRequestLogger(req).warn(
    { path: req.path, method: req.method, reason },
    "Unauthorized request",
  );
  next(new UnauthorizedError());
}

export function createRequireAuth(authService: IAuthService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.method === "OPTIONS") {
      next();
      return;
    }

    if (req.user?.id) {
      next();
      return;
    }

    try {
      let token: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }

      if (!token) {
        const cookies = (req.cookies as Record<string, unknown> | undefined) ?? {};
        token = cookies.accessToken as string | undefined;
      }

      if (token) {
        const isBlacklisted = await authService.isTokenBlacklisted(token, getServiceContext(req));
        if (isBlacklisted) {
          rejectUnauthorized(req, next, "token_blacklisted");
          return;
        }

        const decoded = await authService.verifyAccessToken(token, getServiceContext(req));
        req.user = { id: decoded.id, email: decoded.email };
        next();
        return;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (
        err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError" ||
        err.name === "NotBeforeError"
      ) {
        rejectUnauthorized(req, next, err.name);
        return;
      }

      next(err);
      return;
    }

    if (tryDevUserFallback(req)) {
      next();
      return;
    }

    rejectUnauthorized(req, next, "missing_credentials");
  };
}
