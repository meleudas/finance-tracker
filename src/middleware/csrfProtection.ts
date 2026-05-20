import { randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../utils/errors/securityErrors";

export const CSRF_COOKIE_NAME = "csrfToken";
export const CSRF_HEADER_NAME = "x-csrf-token";

export function issueCsrfToken(res: Response, secure: boolean): string {
  const token = randomBytes(32).toString("hex");

  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return token;
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken = (req.cookies as Record<string, string | undefined> | undefined)?.[
    CSRF_COOKIE_NAME
  ];
  const headerToken = req.header(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new ForbiddenError("Invalid CSRF token"));
    return;
  }

  next();
}
