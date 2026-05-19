import { NextFunction, Request as ExpressRequest } from "express";
import { getServiceContext } from "../http/requestContext";
import { unauthorizedError } from "../utils/apiError";
import { IAuthService } from "../services/interfaces/auth/IAuthService";

export const createAuthMiddleware = (authService: IAuthService) => {
  return async (req: ExpressRequest, next: NextFunction): Promise<void> => {
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
        next(unauthorizedError());
        return;
      }

      const isBlacklisted = await authService.isTokenBlacklisted(token, getServiceContext(req));
      if (isBlacklisted) {
        next(unauthorizedError());
        return;
      }

      const decoded = await authService.verifyAccessToken(token, getServiceContext(req));

      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError" || err.name === "NotBeforeError") {
        next(unauthorizedError());
      } else {
        next(err);
      }
    }
  };
};
