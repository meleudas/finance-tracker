import { EventEmitter } from "node:events";
import type { NextFunction, Request, Response } from "express";
import { attachAbortSignal } from "../../../src/middleware/abortSignal";

function createMockReqRes(): {
  req: EventEmitter & Partial<Request>;
  res: EventEmitter & Partial<Response>;
  next: jest.MockedFunction<NextFunction>;
} {
  const req = new EventEmitter() as EventEmitter & Partial<Request>;
  const res = new EventEmitter() as EventEmitter & Partial<Response>;
  Object.assign(res, { writableEnded: false });
  const next = jest.fn() as jest.MockedFunction<NextFunction>;
  return { req, res, next };
}

describe("attachAbortSignal", () => {
  it("має встановити abortController, abortSignal і викликати next", () => {
    const { req, res, next } = createMockReqRes();

    attachAbortSignal(req as Request, res as Response, next);

    expect(req.abortController).toBeInstanceOf(AbortController);
    expect(req.abortSignal).toBe(req.abortController?.signal);
    expect(req.abortSignal?.aborted).toBe(false);
    expect(next).toHaveBeenCalledWith();
  });

  it("має скасувати signal при close до завершення відповіді", () => {
    const { req, res, next } = createMockReqRes();

    attachAbortSignal(req as Request, res as Response, next);
    req.emit("close");

    expect(req.abortSignal?.aborted).toBe(true);
    expect(next).toHaveBeenCalledWith();
  });

  it("має скасувати signal при aborted до завершення відповіді", () => {
    const { req, res, next } = createMockReqRes();

    attachAbortSignal(req as Request, res as Response, next);
    req.emit("aborted");

    expect(req.abortSignal?.aborted).toBe(true);
  });

  it("не має скасувати signal після finish, якщо відповідь уже завершена", () => {
    const { req, res, next } = createMockReqRes();

    attachAbortSignal(req as Request, res as Response, next);
    Object.assign(res, { writableEnded: true });
    res.emit("finish");
    req.emit("close");

    expect(req.abortSignal?.aborted).toBe(false);
  });
});
