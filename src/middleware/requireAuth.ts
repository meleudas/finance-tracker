import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
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
          next(new UnauthorizedError());
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
        next(new UnauthorizedError());
        return;
      }

      next(err);
      return;
    }

    if (tryDevUserFallback(req)) {
      next();
      return;
    }

    next(new UnauthorizedError());
  };
}
