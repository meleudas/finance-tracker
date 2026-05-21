import request from "supertest";
import express from "express";
import { TransactionController } from "../../../src/controllers/TransactionController";
import type { ITransactionService } from "../../../src/services/interfaces/ITransactionService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  CreateTransactionRequestValidator,
  DeleteTransactionRequestValidator,
  GetTransactionRequestValidator,
  ListTransactionsRequestValidator,
} from "../../../src/validators/transactions.validator";
import { AppError } from "../../../src/utils/errors/appError";
import { ConflictError, NotFoundError } from "../../../src/utils/errors/ClientErrors";

describe("TransactionController (Integration)", () => {
  let app: express.Application;
  let mockService: jest.Mocked<ITransactionService>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const transactionId = "clk7v9x1k0000qzq8x8x8x8xb";
  const accountId = "clm7v9x1k0000qzq8x8x8x8xc";
  const currencyId = "cln7v9x1k0000qzq8x8x8x8x1";

  const transactionResponse = {
    id: transactionId,
    accountId,
    currencyId,
    categoryId: null,
    amount: 100,
    direction: "EXPENSE" as const,
    occurredAt: "2026-05-01T12:00:00.000Z",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    deletedAt: null,
    isDeleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      createTransaction: jest.fn(),
      getTransactions: jest.fn(),
      getTransactionsByAccountId: jest.fn(),
      getTransactionsByCategoryId: jest.fn(),
      getTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      deleteTransaction: jest.fn(),
      getTransactionsByUserId: jest.fn(),
    } as unknown as jest.Mocked<ITransactionService>;

    const controller = new TransactionController(mockService);
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.id = "test-request-id";
      next();
    });

    const mount = "/api/v1/transactions";
    app.use(mount, (req, _res, next) => {
      req.user = { id: userId, email: "test@example.com" };
      next();
    });

    app.get(mount, ListTransactionsRequestValidator, asyncHandler(controller.list));
    app.post(mount, CreateTransactionRequestValidator, asyncHandler(controller.create));
    app.get(`${mount}/:id`, GetTransactionRequestValidator, asyncHandler(controller.getById));
    app.delete(`${mount}/:id`, DeleteTransactionRequestValidator, asyncHandler(controller.remove));

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

  describe("POST /api/v1/transactions", () => {
    it("should create transaction and return 201 envelope", async () => {
      mockService.createTransaction.mockResolvedValue(transactionResponse);

      const res = await request(app).post("/api/v1/transactions").send({
        accountId,
        currencyId,
        amount: 100,
        direction: "EXPENSE",
        occurredAt: "2026-05-01T12:00:00.000Z",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(transactionId);
      expect(mockService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ accountId, currencyId }),
        { id: userId },
        expect.any(Object),
      );
    });
  });

  describe("GET /api/v1/transactions", () => {
    it("should return paginated list envelope", async () => {
      mockService.getTransactions.mockResolvedValue({
        data: [transactionResponse],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const res = await request(app).get("/api/v1/transactions");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.requestId).toBe("test-request-id");
    });
  });

  describe("GET /api/v1/transactions/:id", () => {
    it("should forward NotFoundError as 404", async () => {
      mockService.getTransaction.mockRejectedValue(new NotFoundError("Transaction"));

      const res = await request(app).get(`/api/v1/transactions/${transactionId}`);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/transactions/:id", () => {
    it("should return delete envelope on success", async () => {
      mockService.deleteTransaction.mockResolvedValue({
        id: transactionId,
        isDeleted: true,
        deletedAt: "2026-05-02T00:00:00.000Z",
      });

      const res = await request(app).delete(`/api/v1/transactions/${transactionId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isDeleted).toBe(true);
    });

    it("should forward ConflictError as 409", async () => {
      mockService.deleteTransaction.mockRejectedValue(
        new ConflictError("Transaction has attachments"),
      );

      const res = await request(app).delete(`/api/v1/transactions/${transactionId}`);

      expect(res.status).toBe(409);
    });
  });
});
