import type { CookieOptions } from "express";
import type { ConfigService } from "./ConfigService";

export function getAuthCookieOptions(
  config: ConfigService,
): Pick<CookieOptions, "secure" | "sameSite" | "path"> {
  const secure = config.cookieSecure;
  const sameSite: CookieOptions["sameSite"] = secure ? "none" : "lax";
  return { secure, sameSite, path: "/" };
}
