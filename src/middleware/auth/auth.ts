import { NextFunction, Response, Request as ExpressRequest } from "express";
import { AppError } from "../../utils/errors/appError";
import { getHeader } from "../../utils/helpers/auth/getHeaders";
import { verify } from "jsonwebtoken";
import { config } from "../../config/ConfigService";

export const authMiddleware = (req: ExpressRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = getHeader(req, 'authorization');

    if (!authHeader?.startsWith("Bearer ")) {
      next(new AppError(
        "ACCESS_TOKEN_IS_REQUIRED",
        "Access token is required",
        401));
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      next(new AppError(
        'INVALID_TOKEN_FORMAT',
        'Invalid token format',
        401));
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

    if (err.name === 'JsonWebTokenError') {
      next(new AppError('INVALID_TOKEN', 'Invalid token', 401));
    } else if (err.name === 'TokenExpiredError') {
      next(new AppError('TOKEN_EXPIRED', 'Token expired', 401));
    } else {
      next(err);
    }
  }
};
