import { randomBytes } from "node:crypto";
import type { CookieOptions, NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../utils/errors/securityErrors";

export const CSRF_COOKIE_NAME = "csrfToken";
export const CSRF_HEADER_NAME = "x-csrf-token";

const UNSAFE_HTTP_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isAuthMutationRoute(req: Request): boolean {
  return /^\/auth(\/|$)/.test(req.path);
}

function hasCookieAuthSession(cookies: Record<string, string | undefined>): boolean {
  return Boolean(cookies[CSRF_COOKIE_NAME] ?? cookies.accessToken ?? cookies.refreshToken);
}

export function issueCsrfToken(
  res: Response,
  cookieOptions: Pick<CookieOptions, "secure" | "sameSite" | "path">,
): string {
  const token = randomBytes(32).toString("hex");

  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });

  return token;
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (!UNSAFE_HTTP_METHODS.has(req.method)) {
    next();
    return;
  }

  const cookies = (req.cookies as Record<string, string | undefined> | undefined) ?? {};

  if (!isAuthMutationRoute(req) && !hasCookieAuthSession(cookies)) {
    next();
    return;
  }

  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = req.header(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new ForbiddenError("Invalid CSRF token"));
    return;
  }

  next();
}
