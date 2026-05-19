import { NextFunction, Response, Request as ExpressRequest } from "express";
import { verify } from "jsonwebtoken";
import { config } from "../config/ConfigService";
import { getServiceContext } from "../http/requestContext";
import { unauthorizedError } from "../utils/apiError";
import { IAuthService } from "../services/interfaces/auth/IAuthService";

export const createAuthMiddleware = (authService: IAuthService) => {
  return async (req: ExpressRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cookies = req.cookies as Record<string, unknown>;
      const token = cookies.accessToken;

      if (typeof token !== "string") {
        next(unauthorizedError());
        return;
      }

      const isBlacklisted = await authService.isTokenBlacklisted(token, getServiceContext(req));
      if (isBlacklisted) {
        next(unauthorizedError());
        return;
      }

      const decoded = verify(token, config.jwtAccessSecret) as {
        userId: string;
        email: string;
      };

      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        next(unauthorizedError());
      } else {
        next(err);
      }
    }
  };
};
