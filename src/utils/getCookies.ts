import { Request } from "express";

export function getCookies(req: Request): Record<string, string> {
  return req.cookies as Record<string, string>;
}
