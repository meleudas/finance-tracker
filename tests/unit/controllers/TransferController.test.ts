import request from "supertest";
import express from "express";
import { TransferController } from "../../../src/controllers/TransferController";
import type { ITransferService } from "../../../src/services/interfaces/ITransferService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  CreateTransferRequestValidator,
  DeleteTransferRequestValidator,
  GetTransferRequestValidator,
  ListTransfersByAccountRequestValidator,
  ListTransfersRequestValidator,
  UpdateTransferRequestValidator,
} from "../../../src/validators/transfers.validator";
import {
  createControllerTestApp,
  mountControllerErrorHandler,
  TEST_USER_ID,
} from "../../helpers/controllerUnitTestUtils";

describe("TransferController - Unit Tests", () => {
  let app: express.Application;
  let mockService: jest.Mocked<ITransferService>;

  const transferId = "clk7v9x1k0000qzq8x8x8x8xb";
  const accountId = "clm7v9x1k0000qzq8x8x8x8xc";
  const fromAccountId = "clh7v9x1k0000qzq8x8x8x8x9";
  const toAccountId = "clj7v9x1k0000qzq8x8x8x8xa";
  const currencyId = "cln7v9x1k0000qzq8x8x8x8x1";

  const transfer = {
    id: transferId,
    fromAccountId,
    toAccountId,
    currencyId,
    amount: 50,
    occurredAt: "2026-05-01T12:00:00.000Z",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    deletedAt: null,
    isDeleted: false,
  };

  function buildApp(withUser = true): express.Application {
    mockService = {
      createTransfer: jest.fn(),
      getTransfers: jest.fn(),
      getTransfersByAccountId: jest.fn(),
      getTransfer: jest.fn(),
      updateTransfer: jest.fn(),
      deleteTransfer: jest.fn(),
    } as unknown as jest.Mocked<ITransferService>;

    const controller = new TransferController(mockService);
    const testApp = createControllerTestApp();
    const base = "/api/v1/transfers";

    if (withUser) {
      testApp.use(base, (req, _res, next) => {
        req.user = { id: TEST_USER_ID, email: "test@example.com" };
        next();
      });
      testApp.use("/api/v1/accounts", (req, _res, next) => {
        req.user = { id: TEST_USER_ID, email: "test@example.com" };
        next();
      });
    }

    testApp.get(base, ListTransfersRequestValidator, asyncHandler(controller.list));
    testApp.post(base, CreateTransferRequestValidator, asyncHandler(controller.create));
    testApp.get(`${base}/:id`, GetTransferRequestValidator, asyncHandler(controller.getById));
    testApp.patch(`${base}/:id`, UpdateTransferRequestValidator, asyncHandler(controller.update));
    testApp.delete(`${base}/:id`, DeleteTransferRequestValidator, asyncHandler(controller.remove));
    testApp.get(
      `/api/v1/accounts/:accountId/transfers`,
      ListTransfersByAccountRequestValidator,
      asyncHandler(controller.listByAccount),
    );
    mountControllerErrorHandler(testApp);
    return testApp;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  it("POST / — 201", async () => {
    mockService.createTransfer.mockResolvedValue(transfer);
    const res = await request(app).post("/api/v1/transfers").send({
      fromAccountId,
      toAccountId,
      currencyId,
      amount: 50,
      occurredAt: "2026-05-01T12:00:00.000Z",
    });
    expect(res.status).toBe(201);
  });

  it("GET / — paginated", async () => {
    mockService.getTransfers.mockResolvedValue({
      data: [transfer],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const res = await request(app).get("/api/v1/transfers");
    expect(res.status).toBe(200);
  });

  it("GET /:id", async () => {
    mockService.getTransfer.mockResolvedValue(transfer);
    const res = await request(app).get(`/api/v1/transfers/${transferId}`);
    expect(res.status).toBe(200);
  });

  it("PATCH /:id", async () => {
    mockService.updateTransfer.mockResolvedValue({ ...transfer, amount: 75 });
    const res = await request(app).patch(`/api/v1/transfers/${transferId}`).send({ amount: 75 });
    expect(res.status).toBe(200);
  });

  it("DELETE /:id", async () => {
    mockService.deleteTransfer.mockResolvedValue({
      id: transferId,
      isDeleted: true,
      deletedAt: "2026-05-02T00:00:00.000Z",
    });
    const res = await request(app).delete(`/api/v1/transfers/${transferId}`);
    expect(res.status).toBe(200);
  });

  it("GET by account", async () => {
    mockService.getTransfersByAccountId.mockResolvedValue({
      data: [transfer],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const res = await request(app).get(`/api/v1/accounts/${accountId}/transfers`);
    expect(res.status).toBe(200);
  });

  it("без user → 401", async () => {
    app = buildApp(false);
    const res = await request(app).get("/api/v1/transfers");
    expect(res.status).toBe(401);
  });
});
