import type { Request, Response, NextFunction } from "express";
import { createRequireAuth } from "../../../src/middleware/requireAuth";
import type { IAuthService } from "../../../src/services/interfaces/IAuthService";
import { UnauthorizedError } from "../../../src/utils/errors/securityErrors";

describe("createRequireAuth", () => {
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

    req = {
      headers: {},
      cookies: {},
      header: jest.fn(),
      id: "test-request-id",
      log: { warn: jest.fn(), error: jest.fn(), info: jest.fn() } as unknown as Request["log"],
    };
    res = {};
    next = jest.fn();
  });

  it("має встановити req.user.id з JWT access token", async () => {
    req.headers = { authorization: "Bearer valid_token" };
    mockAuthService.verifyAccessToken.mockResolvedValue({
      id: "clg7v9x1k0000qzq8x8x8x8x8",
      email: "user@example.com",
    });

    const middleware = createRequireAuth(mockAuthService);
    await middleware(req as Request, res as Response, next);

    expect(req.user?.id).toBe("clg7v9x1k0000qzq8x8x8x8x8");
    expect(next).toHaveBeenCalledWith();
  });

  it("має пропустити, якщо req.user вже встановлений", async () => {
    req.user = { id: "existing", email: "a@b.com" };

    const middleware = createRequireAuth(mockAuthService);
    await middleware(req as Request, res as Response, next);

    expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("пропускає OPTIONS без перевірки JWT", async () => {
    req.method = "OPTIONS";

    const middleware = createRequireAuth(mockAuthService);
    await middleware(req as Request, res as Response, next);

    expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("має викликати UnauthorizedError, якщо токена немає", async () => {
    const middleware = createRequireAuth(mockAuthService);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(req.log?.warn).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "missing_credentials" }),
      "Unauthorized request",
    );
  });

  it("читає accessToken з cookies", async () => {
    req.cookies = { accessToken: "cookie_token" };
    mockAuthService.verifyAccessToken.mockResolvedValue({
      id: "clg7v9x1k0000qzq8x8x8x8x8",
      email: "user@example.com",
    });

    const middleware = createRequireAuth(mockAuthService);
    await middleware(req as Request, res as Response, next);

    expect(req.user?.id).toBe("clg7v9x1k0000qzq8x8x8x8x8");
    expect(next).toHaveBeenCalledWith();
  });

  it("UnauthorizedError для blacklisted token", async () => {
    req.headers = { authorization: "Bearer revoked" };
    mockAuthService.isTokenBlacklisted.mockResolvedValue(true);

    const middleware = createRequireAuth(mockAuthService);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it.each(["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"])(
    "мапить %s у UnauthorizedError",
    async (name) => {
      req.headers = { authorization: "Bearer bad" };
      const err = new Error("jwt");
      err.name = name;
      mockAuthService.verifyAccessToken.mockRejectedValue(err);

      const middleware = createRequireAuth(mockAuthService);
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    },
  );

  it("dev fallback через x-user-id у non-production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    (req.header as jest.Mock).mockImplementation((name: string) =>
      name === "x-user-id" ? "dev-user-123" : undefined,
    );

    const middleware = createRequireAuth(mockAuthService);
    await middleware(req as Request, res as Response, next);

    expect(req.user?.id).toBe("dev-user-123");
    expect(next).toHaveBeenCalledWith();
    process.env.NODE_ENV = originalEnv;
  });

  it("прокидає інші помилки з блоку verify", async () => {
    req.headers = { authorization: "Bearer token" };
    const err = new Error("redis");
    mockAuthService.verifyAccessToken.mockRejectedValue(err);

    const middleware = createRequireAuth(mockAuthService);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
