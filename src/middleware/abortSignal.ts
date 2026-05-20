import type { NextFunction, Request, Response } from "express";

/**
 * Binds an AbortController to each request. Aborts when the client disconnects
 * before the response is finished (tab closed, navigation, timeout).
 *
 * Do not abort on every `close` — for POST, `close` fires after the body is read
 * while handlers (e.g. bcrypt) may still run, which caused false 499 on /auth/register.
 */
export function attachAbortSignal(req: Request, res: Response, next: NextFunction): void {
  const controller = new AbortController();
  req.abortController = controller;
  req.abortSignal = controller.signal;

  const abortIfClientGone = (): void => {
    if (res.writableEnded) {
      return;
    }
    controller.abort();
  };

  const abortOnEarlyClose = (): void => {
    if (res.writableEnded) {
      return;
    }
    const incomplete = "complete" in req && !req.complete;
    const disconnected = "destroyed" in req && req.destroyed;
    if (disconnected || incomplete) {
      controller.abort();
    }
  };

  req.on("aborted", abortIfClientGone);
  req.on("close", abortOnEarlyClose);

  res.on("finish", () => {
    req.off("aborted", abortIfClientGone);
    req.off("close", abortOnEarlyClose);
  });

  next();
}
