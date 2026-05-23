import type { NextFunction, Request, Response } from "express";

/**
 * Binds an AbortController to each request. Aborts only on the `aborted` event
 * (client cancelled or connection dropped mid-request).
 *
 * Do not use `close` — it fires after the body is fully read on POST while handlers
 * (bcrypt, DB) still run, which caused false 499 responses in Swagger UI.
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

  req.on("aborted", abortIfClientGone);

  res.on("finish", () => {
    req.off("aborted", abortIfClientGone);
  });

  next();
}
