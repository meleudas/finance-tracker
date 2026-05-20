import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { AuthController } from "../../../src/controllers/AuthController";
import { config } from "../../../src/config/ConfigService";
import type { IAuthService } from "../../../src/services/interfaces/IAuthService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  csrfProtection,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "../../../src/middleware/csrfProtection";
import {
  LoginRequestValidator,
  RegisterRequestValidator,
} from "../../../src/validators/auth.validator";
import { UnauthorizedError } from "../../../src/utils/errors/securityErrors";
import {
  assignTestRequestId,
  createTestAppErrorHandler,
  formatSetCookieHeader,
  getResponseData,
  getResponseError,
} from "../../helpers/httpTestUtils";

describe("AuthController (Integration)", () => {
  let app: express.Application;
  let mockAuthService: jest.Mocked<IAuthService>;

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

    const authController = new AuthController(mockAuthService, config);

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(assignTestRequestId);

    app.get("/api/v1/auth/csrf", asyncHandler(authController.csrfHandler));
    app.post(
      "/api/v1/auth/login",
      csrfProtection,
      LoginRequestValidator,
      asyncHandler(authController.loginHandler),
    );
    app.post(
      "/api/v1/auth/register",
      csrfProtection,
      RegisterRequestValidator,
      asyncHandler(authController.registerHandler),
    );

    app.use(createTestAppErrorHandler());
  });

  async function getCsrfAgent() {
    const agent = request.agent(app);
    const csrfRes = await agent.get("/api/v1/auth/csrf").expect(200);
    const csrfToken = (getResponseData(csrfRes) as { csrfToken: string }).csrfToken;
    return { agent, csrfToken };
  }

  describe("GET /api/v1/auth/csrf", () => {
    it("should return csrf token", async () => {
      const res = await request(app).get("/api/v1/auth/csrf");

      expect(res.status).toBe(200);
      expect((getResponseData(res) as { csrfToken: string }).csrfToken).toBeDefined();
      const cookieHeader = formatSetCookieHeader(res.headers["set-cookie"]);
      expect(cookieHeader).toContain(CSRF_COOKIE_NAME);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should return 403 without CSRF token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "user@example.com", password: "wrong" });

      expect(res.status).toBe(403);
    });

    it("should return 401 (not 500) for invalid credentials with CSRF", async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedError());

      const { agent, csrfToken } = await getCsrfAgent();

      const res = await agent
        .post("/api/v1/auth/login")
        .set(CSRF_HEADER_NAME, csrfToken)
        .send({ email: "nonexistent@example.com", password: "WrongPass123!" });

      expect(res.status).toBe(401);
      expect(getResponseError(res).code).toBe("UNAUTHORIZED");
    });

    it("should return tokens in JSON and set cookies on success", async () => {
      mockAuthService.login.mockResolvedValue({
        user: {
          id: "clg7v9x1k0000qzq8x8x8x8x8",
          email: "user@example.com",
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
        accessToken: "access_test",
        refreshToken: "refresh_test",
      });

      const { agent, csrfToken } = await getCsrfAgent();

      const res = await agent
        .post("/api/v1/auth/login")
        .set(CSRF_HEADER_NAME, csrfToken)
        .send({ email: "user@example.com", password: "StrongPass123!" });

      expect(res.status).toBe(200);
      const data = getResponseData(res) as { accessToken: string; refreshToken: string };
      expect(data.accessToken).toBe("access_test");
      expect(data.refreshToken).toBe("refresh_test");
      const cookieHeader = formatSetCookieHeader(res.headers["set-cookie"]);
      expect(cookieHeader).toContain("accessToken");
    });
  });

  describe("POST /api/v1/auth/register", () => {
    it("should return 403 without CSRF header", async () => {
      const agent = request.agent(app);
      await agent.get("/api/v1/auth/csrf");

      const res = await agent.post("/api/v1/auth/register").send({
        email: "newuser@example.com",
        password: "StrongPass123!",
      });

      expect(res.status).toBe(403);
    });
  });
});
