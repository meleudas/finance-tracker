import type { NextFunction, Request, Response } from "express";
import { createAuthMiddleware } from "../../../src/middleware/auth";
import type { IAuthService } from "../../../src/services/interfaces/IAuthService";
import { UnauthorizedError } from "../../../src/utils/errors/securityErrors";

describe("createAuthMiddleware", () => {
  let mockAuthService: jest.Mocked<IAuthService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      logout: jest.fn(),
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    };
    req = { headers: {}, cookies: {}, id: "req-1" };
    res = {};
    next = jest.fn();
  });

  it("встановлює req.user з Bearer token", async () => {
    req.headers = { authorization: "Bearer access_token" };
    mockAuthService.verifyAccessToken.mockResolvedValue({
      id: "clg7v9x1k0000qzq8x8x8x8x8",
      email: "user@example.com",
    });

    await createAuthMiddleware(mockAuthService)(req as Request, res as Response, next);

    expect(req.user).toEqual({ id: "clg7v9x1k0000qzq8x8x8x8x8", email: "user@example.com" });
    expect(next).toHaveBeenCalledWith();
  });

  it("читає accessToken з cookies", async () => {
    req.cookies = { accessToken: "cookie_token" };
    mockAuthService.verifyAccessToken.mockResolvedValue({
      id: "clg7v9x1k0000qzq8x8x8x8x8",
      email: "user@example.com",
    });

    await createAuthMiddleware(mockAuthService)(req as Request, res as Response, next);

    expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(
      "cookie_token",
      expect.any(Object),
    );
    expect(next).toHaveBeenCalledWith();
  });

  it("UnauthorizedError без токена", async () => {
    await createAuthMiddleware(mockAuthService)(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("UnauthorizedError для blacklisted token", async () => {
    req.headers = { authorization: "Bearer bad_token" };
    mockAuthService.isTokenBlacklisted.mockResolvedValue(true);

    await createAuthMiddleware(mockAuthService)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it.each(["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"])(
    "мапить %s у UnauthorizedError",
    async (name) => {
      req.headers = { authorization: "Bearer invalid" };
      const err = new Error("jwt");
      err.name = name;
      mockAuthService.verifyAccessToken.mockRejectedValue(err);

      await createAuthMiddleware(mockAuthService)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    },
  );

  it("прокидає інші помилки", async () => {
    req.headers = { authorization: "Bearer token" };
    const err = new Error("db down");
    mockAuthService.verifyAccessToken.mockRejectedValue(err);

    await createAuthMiddleware(mockAuthService)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it("обробляє non-Error throw", async () => {
    req.headers = { authorization: "Bearer token" };
    mockAuthService.verifyAccessToken.mockRejectedValue("string-error");

    await createAuthMiddleware(mockAuthService)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
