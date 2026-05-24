import type { NextFunction, Request, Response } from "express";

const rateLimitMock = jest.fn(
  (_opts: {
    handler?: (req: unknown, res: unknown) => void;
    skip?: (req: { path: string }) => boolean;
  }) => {
    return (_req: unknown, _res: unknown, next: NextFunction) => {
      next();
    };
  },
);

jest.mock("express-rate-limit", () => ({
  __esModule: true,
  default: rateLimitMock,
}));

describe("rateLimit middleware", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
    rateLimitMock.mockClear();
  });

  it("у test повертає noop limiter", async () => {
    process.env.NODE_ENV = "test";
    jest.resetModules();
    const { apiLimiter, strictLimiter } =
      (await import("../../../src/middleware/rateLimit")) as typeof import("../../../src/middleware/rateLimit");
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    apiLimiter({} as Request, {} as Response, next);
    strictLimiter({} as Request, {} as Response, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(rateLimitMock).not.toHaveBeenCalled();
  });

  it("у development створює express-rate-limit", async () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();
    const { apiLimiter } = await import("../../../src/middleware/rateLimit");
    expect(typeof apiLimiter).toBe("function");
    expect(rateLimitMock).toHaveBeenCalled();
  });

  it("у development викликає handler та skip для /health", async () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();
    await import("../../../src/middleware/rateLimit");

    const apiOpts = rateLimitMock.mock.calls[0]?.[0] as {
      handler: (req: unknown, res: { status: jest.Mock; json: jest.Mock }) => void;
      skip: (req: { path: string }) => boolean;
    };
    const strictOpts = rateLimitMock.mock.calls[1]?.[0] as {
      handler: (req: unknown, res: { status: jest.Mock; json: jest.Mock }) => void;
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    apiOpts.handler({}, res);
    expect(res.status).toHaveBeenCalledWith(429);

    const strictRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    strictOpts.handler({}, strictRes);
    expect(strictRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "RATE_LIMITED" }) }),
    );

    expect(apiOpts.skip({ path: "/health" })).toBe(true);
    expect(apiOpts.skip({ path: "/api" })).toBe(false);
  });
});
