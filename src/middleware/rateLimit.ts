import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { RateLimitError } from "../utils/errors/securityErrors";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: new RateLimitError("Too many requests, please try again later"),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests, please try again later",
      },
    });
  },
  skip: (req) => env.NODE_ENV !== "production" && req.path === "/health",
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: new RateLimitError("Too many attempts, please try again in an hour"),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many attempts, please try again in an hour",
      },
    });
  },
});
