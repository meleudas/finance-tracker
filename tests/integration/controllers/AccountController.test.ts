import request from "supertest";
import express from "express";
import { AccountController } from "../../../src/controllers/AccountController";
import type { IAccountService } from "../../../src/services/interfaces/IAccountService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  CreateAccountRequestValidator,
  DeleteAccountRequestValidator,
  GetAccountRequestValidator,
  ListAccountsRequestValidator,
  UpdateAccountRequestValidator,
} from "../../../src/validators/account.validator";
import { AppError } from "../../../src/utils/errors/appError";
import { ConflictError, NotFoundError } from "../../../src/utils/errors/ClientErrors";

describe("AccountController (Integration)", () => {
  let app: express.Application;
  let mockService: jest.Mocked<IAccountService>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const accountId = "clk7v9x1k0000qzq8x8x8x8xb";
  const currencyId = "clm7v9x1k0000qzq8x8x8x8xc";

  const accountResponse = {
    id: accountId,
    userId,
    currencyId,
    name: "Main",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    isDeleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      createAccount: jest.fn(),
      getAccounts: jest.fn(),
      getAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn(),
    } as unknown as jest.Mocked<IAccountService>;

    const controller = new AccountController(mockService);
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.id = "test-request-id";
      next();
    });

    const mount = "/api/v1/accounts";
    app.use(mount, (req, _res, next) => {
      req.user = { id: userId, email: "test@example.com" };
      next();
    });

    app.get(mount, ListAccountsRequestValidator, asyncHandler(controller.list));
    app.post(mount, CreateAccountRequestValidator, asyncHandler(controller.create));
    app.get(`${mount}/:id`, GetAccountRequestValidator, asyncHandler(controller.getById));
    app.patch(`${mount}/:id`, UpdateAccountRequestValidator, asyncHandler(controller.update));
    app.delete(`${mount}/:id`, DeleteAccountRequestValidator, asyncHandler(controller.remove));

    app.use(
      (
        err: Error | AppError,
        req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        const isAppError = err instanceof AppError;
        const statusCode = isAppError ? err.statusCode : 500;
        const code = isAppError ? err.code : "INTERNAL_ERROR";
        const message = isAppError ? err.message : "Internal server error";
        res.status(statusCode).json({
          error: { code, message, requestId: String(req.id ?? "test") },
        });
      },
    );
  });

  describe("POST /api/v1/accounts", () => {
    it("should create account and return 201 envelope", async () => {
      mockService.createAccount.mockResolvedValue(accountResponse);

      const res = await request(app).post("/api/v1/accounts").send({ name: "Main", currencyId });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(accountId);
      expect(res.body.data).not.toHaveProperty("note");
      expect(mockService.createAccount).toHaveBeenCalledWith(
        { name: "Main", currencyId },
        { id: userId },
        expect.any(Object),
      );
    });
  });

  describe("GET /api/v1/accounts", () => {
    it("should return paginated list envelope", async () => {
      mockService.getAccounts.mockResolvedValue({
        data: [accountResponse],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const res = await request(app).get("/api/v1/accounts");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.requestId).toBe("test-request-id");
    });
  });

  describe("GET /api/v1/accounts/:id", () => {
    it("should return account in envelope", async () => {
      mockService.getAccount.mockResolvedValue(accountResponse);

      const res = await request(app).get(`/api/v1/accounts/${accountId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(accountId);
    });

    it("should forward NotFoundError as 404", async () => {
      mockService.getAccount.mockRejectedValue(new NotFoundError("Account"));

      const res = await request(app).get(`/api/v1/accounts/${accountId}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/accounts/:id", () => {
    it("should update account name", async () => {
      mockService.updateAccount.mockResolvedValue({ ...accountResponse, name: "Savings" });

      const res = await request(app)
        .patch(`/api/v1/accounts/${accountId}`)
        .send({ name: "Savings" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Savings");
    });
  });

  describe("DELETE /api/v1/accounts/:id", () => {
    it("should return delete envelope on success", async () => {
      mockService.deleteAccount.mockResolvedValue({
        id: accountId,
        isDeleted: true,
        deletedAt: "2026-05-02T00:00:00.000Z",
      });

      const res = await request(app).delete(`/api/v1/accounts/${accountId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isDeleted).toBe(true);
    });

    it("should forward ConflictError as 409", async () => {
      mockService.deleteAccount.mockRejectedValue(new ConflictError("Account has related records"));

      const res = await request(app).delete(`/api/v1/accounts/${accountId}`);

      expect(res.status).toBe(409);
    });
  });

  describe("auth", () => {
    it("should return 401 when user is missing", async () => {
      const controller = new AccountController(mockService);
      const authApp = express();
      authApp.use(express.json());
      authApp.get(
        "/api/v1/accounts/:id",
        GetAccountRequestValidator,
        asyncHandler(controller.getById),
      );
      authApp.use(
        (
          err: Error | AppError,
          req: express.Request,
          res: express.Response,
          _next: express.NextFunction,
        ) => {
          const isAppError = err instanceof AppError;
          res.status(isAppError ? err.statusCode : 500).json({
            error: {
              code: isAppError ? err.code : "INTERNAL_ERROR",
              message: isAppError ? err.message : "Internal server error",
              requestId: String(req.id ?? "test"),
            },
          });
        },
      );

      const res = await request(authApp).get(`/api/v1/accounts/${accountId}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
