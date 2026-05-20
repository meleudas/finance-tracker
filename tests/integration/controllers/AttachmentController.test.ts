import request from "supertest";
import express from "express";
import { AttachmentController } from "../../../src/controllers/AttachmentController";
import type { IAttachmentService } from "../../../src/services/interfaces/IAttachmentService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  ConfirmPresignedUploadRequestValidator,
  DeleteAttachmentRequestValidator,
  GetAttachmentRequestValidator,
  ListAttachmentsRequestValidator,
} from "../../../src/validators/attachments.validator";
import { AppError } from "../../../src/utils/errors/appError";
import { NotFoundError } from "../../../src/utils/errors/ClientErrors";

describe("AttachmentController (Integration)", () => {
  let app: express.Application;
  let mockService: jest.Mocked<IAttachmentService>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const transactionId = "clk7v9x1k0000qzq8x8x8x8xb";
  const attachmentId = "clm7v9x1k0000qzq8x8x8x8xc";

  const attachmentResponse = {
    id: attachmentId,
    transactionId,
    mimeType: "application/pdf",
    originalName: "receipt.pdf",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    deletedAt: null,
    isDeleted: false,
  };

  const attachmentWithUrl = {
    ...attachmentResponse,
    downloadUrl: "https://download.example/url",
    expiresInSeconds: 3600,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      uploadAttachment: jest.fn(),
      getPresignedUploadUrl: jest.fn(),
      confirmPresignedUpload: jest.fn(),
      updateAttachment: jest.fn(),
      deleteAttachment: jest.fn(),
      getAttachment: jest.fn(),
      getAttachmentDownloadUrl: jest.fn(),
      getAttachments: jest.fn(),
    } as unknown as jest.Mocked<IAttachmentService>;

    const controller = new AttachmentController(mockService);
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.id = "test-request-id";
      next();
    });

    const base = "/api/v1/transactions/:transactionId/attachments";
    app.use(base, (req, _res, next) => {
      req.user = { id: userId, email: "test@example.com" };
      next();
    });

    app.get(base, ListAttachmentsRequestValidator, asyncHandler(controller.list));
    app.post(
      `${base}/confirm`,
      ConfirmPresignedUploadRequestValidator,
      asyncHandler(controller.confirmPresignedUpload),
    );
    app.get(`${base}/:id`, GetAttachmentRequestValidator, asyncHandler(controller.getById));
    app.delete(`${base}/:id`, DeleteAttachmentRequestValidator, asyncHandler(controller.remove));

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

  describe("GET /attachments", () => {
    it("returns list envelope with 200", async () => {
      mockService.getAttachments.mockResolvedValue([attachmentWithUrl]);

      const res = await request(app).get(`/api/v1/transactions/${transactionId}/attachments`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(attachmentId);
      expect(mockService.getAttachments).toHaveBeenCalledWith(
        { transactionId },
        { id: userId },
        expect.anything(),
        expect.objectContaining({ signal: undefined }),
      );
    });
  });

  describe("POST /attachments/confirm", () => {
    it("returns 201 envelope after confirm", async () => {
      mockService.confirmPresignedUpload.mockResolvedValue(attachmentResponse);

      const res = await request(app)
        .post(`/api/v1/transactions/${transactionId}/attachments/confirm`)
        .send({
          storageKey: `attachments/${userId}/file.pdf`,
          originalName: "receipt.pdf",
          mimeType: "application/pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(attachmentId);
      expect(res.body.data).not.toHaveProperty("storageKey");
    });
  });

  describe("GET /attachments/:id", () => {
    it("returns 404 when service throws NotFoundError", async () => {
      mockService.getAttachment.mockRejectedValue(new NotFoundError("Attachment"));

      const res = await request(app).get(
        `/api/v1/transactions/${transactionId}/attachments/${attachmentId}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("DELETE /attachments/:id", () => {
    it("returns 200 delete envelope", async () => {
      mockService.deleteAttachment.mockResolvedValue({
        id: attachmentId,
        deletedAt: "2026-05-02T00:00:00.000Z",
        isDeleted: true,
      });

      const res = await request(app).delete(
        `/api/v1/transactions/${transactionId}/attachments/${attachmentId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(attachmentId);
    });
  });
});
