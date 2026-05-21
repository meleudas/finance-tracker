import request from "supertest";
import express from "express";
import { TransferController } from "../../../src/controllers/TransferController";
import type { ITransferService } from "../../../src/services/interfaces/ITransferService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  CreateTransferRequestValidator,
  DeleteTransferRequestValidator,
  GetTransferRequestValidator,
  ListTransfersRequestValidator,
} from "../../../src/validators/transfers.validator";
import { AppError } from "../../../src/utils/errors/appError";
import { NotFoundError } from "../../../src/utils/errors/ClientErrors";

describe("TransferController (Integration)", () => {
  let app: express.Application;
  let mockService: jest.Mocked<ITransferService>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const transferId = "clk7v9x1k0000qzq8x8x8x8xb";
  const fromAccountId = "clm7v9x1k0000qzq8x8x8x8xc";
  const toAccountId = "cln7v9x1k0000qzq8x8x8x8x2";
  const currencyId = "clo7v9x1k0000qzq8x8x8x8x3";

  const transferResponse = {
    id: transferId,
    fromAccountId,
    toAccountId,
    currencyId,
    amount: 100,
    occurredAt: "2026-05-01T12:00:00.000Z",
    note: null,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    deletedAt: null,
    isDeleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      createTransfer: jest.fn(),
      getTransfers: jest.fn(),
      getTransfersByAccountId: jest.fn(),
      getTransfer: jest.fn(),
      updateTransfer: jest.fn(),
      deleteTransfer: jest.fn(),
      getTransfersByUserId: jest.fn(),
    } as unknown as jest.Mocked<ITransferService>;

    const controller = new TransferController(mockService);
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.id = "test-request-id";
      next();
    });

    const mount = "/api/v1/transfers";
    app.use(mount, (req, _res, next) => {
      req.user = { id: userId, email: "test@example.com" };
      next();
    });

    app.get(mount, ListTransfersRequestValidator, asyncHandler(controller.list));
    app.post(mount, CreateTransferRequestValidator, asyncHandler(controller.create));
    app.get(`${mount}/:id`, GetTransferRequestValidator, asyncHandler(controller.getById));
    app.delete(`${mount}/:id`, DeleteTransferRequestValidator, asyncHandler(controller.remove));

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

  describe("POST /api/v1/transfers", () => {
    it("should create transfer and return 201 envelope", async () => {
      mockService.createTransfer.mockResolvedValue(transferResponse);

      const res = await request(app).post("/api/v1/transfers").send({
        fromAccountId,
        toAccountId,
        currencyId,
        amount: 100,
        occurredAt: "2026-05-01T12:00:00.000Z",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(transferId);
      expect(mockService.createTransfer).toHaveBeenCalledWith(
        expect.objectContaining({ fromAccountId, toAccountId, currencyId }),
        { id: userId },
        expect.any(Object),
      );
    });
  });

  describe("GET /api/v1/transfers", () => {
    it("should return paginated list envelope", async () => {
      mockService.getTransfers.mockResolvedValue({
        data: [transferResponse],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const res = await request(app).get("/api/v1/transfers");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.requestId).toBe("test-request-id");
    });
  });

  describe("GET /api/v1/transfers/:id", () => {
    it("should forward NotFoundError as 404", async () => {
      mockService.getTransfer.mockRejectedValue(new NotFoundError("Transfer"));

      const res = await request(app).get(`/api/v1/transfers/${transferId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("DELETE /api/v1/transfers/:id", () => {
    it("should return delete envelope on success", async () => {
      mockService.deleteTransfer.mockResolvedValue({
        id: transferId,
        isDeleted: true,
        deletedAt: "2026-05-02T00:00:00.000Z",
      });

      const res = await request(app).delete(`/api/v1/transfers/${transferId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isDeleted).toBe(true);
    });
  });
});
