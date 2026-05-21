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
  });
});
