import request from "supertest";
import express from "express";
import { AttachmentController } from "../../../src/controllers/AttachmentController";
import type { IAttachmentService } from "../../../src/services/interfaces/IAttachmentService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  ConfirmPresignedUploadRequestValidator,
  DeleteAttachmentRequestValidator,
  GetAttachmentDownloadUrlRequestValidator,
  GetAttachmentRequestValidator,
  ListAttachmentsRequestValidator,
  PresignedUploadRequestValidator,
  PresignedUploadUrlRequestValidator,
  UpdateAttachmentRequestValidator,
  UploadAttachmentParamsValidator,
} from "../../../src/validators/attachments.validator";
import {
  createControllerTestApp,
  mountControllerErrorHandler,
  TEST_USER_ID,
} from "../../helpers/controllerUnitTestUtils";
import {
  handleMulterError,
  uploadAttachmentMiddleware,
} from "../../../src/middleware/uploadAttachment";

describe("AttachmentController - Unit Tests", () => {
  let app: express.Application;
  let mockService: jest.Mocked<IAttachmentService>;

  const transactionId = "clk7v9x1k0000qzq8x8x8x8xb";
  const attachmentId = "clm7v9x1k0000qzq8x8x8x8xc";

  const attachment = {
    id: attachmentId,
    transactionId,
    mimeType: "application/pdf",
    originalName: "receipt.pdf",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    deletedAt: null,
    isDeleted: false,
    downloadUrl: "https://example.com/dl",
    expiresInSeconds: 900,
  };

  function buildApp(withUser = true): express.Application {
    mockService = {
      uploadAttachment: jest.fn(),
      getPresignedUploadUrl: jest.fn(),
      uploadPresignedFile: jest.fn(),
      confirmPresignedUpload: jest.fn(),
      updateAttachment: jest.fn(),
      deleteAttachment: jest.fn(),
      getAttachment: jest.fn(),
      getAttachmentDownloadUrl: jest.fn(),
      getAttachments: jest.fn(),
    } as unknown as jest.Mocked<IAttachmentService>;

    const controller = new AttachmentController(mockService);
    const testApp = createControllerTestApp();
    const base = "/api/v1/transactions/:transactionId/attachments";

    if (withUser) {
      testApp.use("/api/v1/transactions", (req, _res, next) => {
        req.user = { id: TEST_USER_ID, email: "test@example.com" };
        next();
      });
    }

    testApp.get(base, ListAttachmentsRequestValidator, asyncHandler(controller.list));
    testApp.get(`${base}/:id`, GetAttachmentRequestValidator, asyncHandler(controller.getById));
    testApp.get(
      `${base}/:id/download-url`,
      GetAttachmentDownloadUrlRequestValidator,
      asyncHandler(controller.getDownloadUrl),
    );
    testApp.post(
      base,
      UploadAttachmentParamsValidator,
      (req, _res, next) => {
        req.file = {
          fieldname: "file",
          originalname: "receipt.pdf",
          encoding: "7bit",
          mimetype: "application/pdf",
          size: 4,
          buffer: Buffer.from("test"),
          stream: null as never,
          destination: "",
          filename: "",
          path: "",
        };
        next();
      },
      asyncHandler(controller.upload),
    );
    testApp.post(
      `${base}/presigned-upload-url`,
      PresignedUploadUrlRequestValidator,
      asyncHandler(controller.createPresignedUploadUrl),
    );
    testApp.put(
      `${base}/presigned-upload`,
      uploadAttachmentMiddleware,
      handleMulterError,
      PresignedUploadRequestValidator,
      asyncHandler(controller.uploadPresignedFile),
    );
    testApp.post(
      `${base}/confirm`,
      ConfirmPresignedUploadRequestValidator,
      asyncHandler(controller.confirmPresignedUpload),
    );
    testApp.patch(`${base}/:id`, UpdateAttachmentRequestValidator, asyncHandler(controller.update));
    testApp.delete(
      `${base}/:id`,
      DeleteAttachmentRequestValidator,
      asyncHandler(controller.remove),
    );
    mountControllerErrorHandler(testApp);
    return testApp;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  it("GET / — list", async () => {
    mockService.getAttachments.mockResolvedValue([attachment]);
    const res = await request(app).get(`/api/v1/transactions/${transactionId}/attachments`);
    expect(res.status).toBe(200);
  });

  it("GET /:id", async () => {
    mockService.getAttachment.mockResolvedValue(attachment);
    const res = await request(app).get(
      `/api/v1/transactions/${transactionId}/attachments/${attachmentId}`,
    );
    expect(res.status).toBe(200);
  });

  it("GET /:id/download-url", async () => {
    mockService.getAttachmentDownloadUrl.mockResolvedValue({
      downloadUrl: "https://example.com/dl",
      expiresInSeconds: 900,
    });
    const res = await request(app).get(
      `/api/v1/transactions/${transactionId}/attachments/${attachmentId}/download-url`,
    );
    expect(res.status).toBe(200);
  });

  it("POST / — upload 201", async () => {
    mockService.uploadAttachment.mockResolvedValue(attachment);
    const res = await request(app).post(`/api/v1/transactions/${transactionId}/attachments`);
    expect(res.status).toBe(201);
  });

  it("POST / — 400 без файлу", async () => {
    const noFileApp = createControllerTestApp();
    noFileApp.use("/api/v1/transactions", (req, _res, next) => {
      req.user = { id: TEST_USER_ID, email: "test@example.com" };
      next();
    });
    const controller = new AttachmentController(mockService);
    noFileApp.post(
      "/api/v1/transactions/:transactionId/attachments",
      UploadAttachmentParamsValidator,
      asyncHandler(controller.upload),
    );
    mountControllerErrorHandler(noFileApp);

    const res = await request(noFileApp).post(`/api/v1/transactions/${transactionId}/attachments`);
    expect(res.status).toBe(400);
  });

  it("POST /presigned-upload-url — 201", async () => {
    mockService.getPresignedUploadUrl.mockResolvedValue({
      uploadUrl: "https://example.com/upload",
      storageKey: "key",
      expiresInSeconds: 900,
    });
    const res = await request(app)
      .post(`/api/v1/transactions/${transactionId}/attachments/presigned-upload-url`)
      .send({ originalName: "a.pdf", mimeType: "application/pdf" });
    expect(res.status).toBe(201);
  });

  it("PUT /presigned-upload — 200", async () => {
    const storageKey = `attachments/${TEST_USER_ID}/file.pdf`;
    mockService.uploadPresignedFile.mockResolvedValue({ storageKey });
    const res = await request(app)
      .put(`/api/v1/transactions/${transactionId}/attachments/presigned-upload`)
      .field("storageKey", storageKey)
      .attach("file", Buffer.from("pdf"), {
        filename: "receipt.pdf",
        contentType: "application/pdf",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.storageKey).toBe(storageKey);
  });

  it("PUT /presigned-upload — 400 без файлу", async () => {
    const noFileApp = createControllerTestApp();
    noFileApp.use("/api/v1/transactions", (req, _res, next) => {
      req.user = { id: TEST_USER_ID, email: "test@example.com" };
      next();
    });
    const controller = new AttachmentController(mockService);
    noFileApp.put(
      "/api/v1/transactions/:transactionId/attachments/presigned-upload",
      PresignedUploadRequestValidator,
      asyncHandler(controller.uploadPresignedFile),
    );
    mountControllerErrorHandler(noFileApp);

    const res = await request(noFileApp)
      .put(`/api/v1/transactions/${transactionId}/attachments/presigned-upload`)
      .field("storageKey", `attachments/${TEST_USER_ID}/file.pdf`);
    expect(res.status).toBe(400);
  });

  it("POST /confirm — 201", async () => {
    mockService.confirmPresignedUpload.mockResolvedValue(attachment);
    const res = await request(app)
      .post(`/api/v1/transactions/${transactionId}/attachments/confirm`)
      .send({
        storageKey: `attachments/${TEST_USER_ID}/file.pdf`,
        originalName: "receipt.pdf",
        mimeType: "application/pdf",
      });
    expect(res.status).toBe(201);
  });

  it("PATCH /:id", async () => {
    mockService.updateAttachment.mockResolvedValue({ ...attachment, originalName: "new.pdf" });
    const res = await request(app)
      .patch(`/api/v1/transactions/${transactionId}/attachments/${attachmentId}`)
      .send({ originalName: "new.pdf" });
    expect(res.status).toBe(200);
  });

  it("DELETE /:id", async () => {
    mockService.deleteAttachment.mockResolvedValue({
      id: attachmentId,
      isDeleted: true,
      deletedAt: "2026-05-02T00:00:00.000Z",
    });
    const res = await request(app).delete(
      `/api/v1/transactions/${transactionId}/attachments/${attachmentId}`,
    );
    expect(res.status).toBe(200);
  });

  it("без user → 401", async () => {
    app = buildApp(false);
    const res = await request(app).get(`/api/v1/transactions/${transactionId}/attachments`);
    expect(res.status).toBe(401);
  });
});
