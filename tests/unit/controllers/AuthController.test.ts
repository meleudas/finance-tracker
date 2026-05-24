import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { AuthController } from "../../../src/controllers/AuthController";
import { config } from "../../../src/config/ConfigService";
import type { IAuthService } from "../../../src/services/interfaces/IAuthService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  LoginRequestValidator,
  RefreshTokenRequestValidator,
  RegisterRequestValidator,
} from "../../../src/validators/auth.validator";
import { createTestAppErrorHandler } from "../../helpers/httpTestUtils";

describe("AuthController - Unit Tests", () => {
  let app: express.Application;
  let mockAuthService: jest.Mocked<IAuthService>;

  const user = {
    id: "clg7v9x1k0000qzq8x8x8x8x8",
    email: "user@example.com",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  };

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

    const controller = new AuthController(mockAuthService, config);
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.get("/api/v1/auth/csrf", controller.csrfHandler);
    app.post(
      "/api/v1/auth/register",
      RegisterRequestValidator,
      asyncHandler(controller.registerHandler),
    );
    app.post("/api/v1/auth/login", LoginRequestValidator, asyncHandler(controller.loginHandler));
    app.post(
      "/api/v1/auth/refresh",
      RefreshTokenRequestValidator,
      asyncHandler(controller.refreshHandler),
    );
    app.post("/api/v1/auth/logout", asyncHandler(controller.logoutHandler));
    app.use(createTestAppErrorHandler());
  });

  it("GET /csrf — повертає токен", async () => {
    const res = await request(app).get("/api/v1/auth/csrf");
    expect(res.status).toBe(200);
    expect(res.body.data.csrfToken).toBeDefined();
  });

  it("POST /register — 201 з cookies", async () => {
    mockAuthService.register.mockResolvedValue({
      user,
      accessToken: "access",
      refreshToken: "refresh",
    });

    const res = await request(app).post("/api/v1/auth/register").send({
      email: "new@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBe("access");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("POST /login — 200", async () => {
    mockAuthService.login.mockResolvedValue({
      user,
      accessToken: "access",
      refreshToken: "refresh",
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
  });

  it("POST /refresh — 401 без refresh token", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").send({});
    expect(res.status).toBe(401);
  });

  it("POST /refresh — 401 для blacklisted token", async () => {
    mockAuthService.isTokenBlacklisted.mockResolvedValue(true);

    const res = await request(app).post("/api/v1/auth/refresh").send({ refreshToken: "revoked" });

    expect(res.status).toBe(401);
  });

  it("POST /refresh — 200 з cookie refreshToken", async () => {
    mockAuthService.refreshToken.mockResolvedValue({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", ["refreshToken=old-refresh"])
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBe("new-access");
  });

  it("POST /logout — 200 та clear cookies", async () => {
    mockAuthService.logout.mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", "Bearer access")
      .set("Cookie", ["accessToken=access", "refreshToken=refresh"]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockAuthService.logout).toHaveBeenCalledWith("access", "refresh", expect.any(Object));
  });
});
