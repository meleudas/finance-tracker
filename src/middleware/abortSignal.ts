import type { NextFunction, Request, Response } from "express";

/**
 * Binds an AbortController to each request. Aborts when the client disconnects
 * before the response is finished (tab closed, navigation, timeout).
 */
export function attachAbortSignal(req: Request, res: Response, next: NextFunction): void {
  const controller = new AbortController();
  req.abortController = controller;
  req.abortSignal = controller.signal;

  const abortIfClientGone = (): void => {
    if (!res.writableEnded) {
      controller.abort();
    }
  };

  req.on("aborted", abortIfClientGone);
  req.on("close", abortIfClientGone);

  res.on("finish", () => {
    req.off("aborted", abortIfClientGone);
    req.off("close", abortIfClientGone);
  });

  next();
}
