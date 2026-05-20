import type { NextFunction, Request as ExpressRequest, Response } from "express";
import { getServiceContext } from "../http/requestContext";
import { UnauthorizedError } from "../utils/errors/securityErrors";
import type { IAuthService } from "../services/interfaces/IAuthService";

export const createAuthMiddleware = (authService: IAuthService) => {
  return async (req: ExpressRequest, _res: Response, next: NextFunction): Promise<void> => {
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

      if (!token) {
        next(new UnauthorizedError());
        return;
      }

      const isBlacklisted = await authService.isTokenBlacklisted(token, getServiceContext(req));
      if (isBlacklisted) {
        next(new UnauthorizedError());
        return;
      }

      const decoded = await authService.verifyAccessToken(token, getServiceContext(req));

      req.user = {
        id: decoded.id,
        email: decoded.email,
      };

      next();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (
        err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError" ||
        err.name === "NotBeforeError"
      ) {
        next(new UnauthorizedError());
      } else {
        next(err);
      }
    }
  };
};
