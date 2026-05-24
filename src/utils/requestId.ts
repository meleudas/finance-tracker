import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidRequestId(value: string): boolean {
  return UUID_RE.test(value);
}

export function resolveRequestId(req: IncomingMessage, res: ServerResponse): string {
  const incoming = req.headers["x-request-id"];
  if (typeof incoming === "string") {
    const trimmed = incoming.trim();
    if (isValidRequestId(trimmed)) {
      res.setHeader("X-Request-Id", trimmed);
      return trimmed;
    }
  }

  const id = randomUUID();
  res.setHeader("X-Request-Id", id);
  return id;
}

export function requestIdFrom(req: { id?: unknown }): string {
  if (typeof req.id === "string" && req.id.length > 0) {
    return req.id;
  }
  return "unknown";
}
