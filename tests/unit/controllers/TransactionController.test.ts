import request from "supertest";
import express from "express";
import { TransactionController } from "../../../src/controllers/TransactionController";
import type { ITransactionService } from "../../../src/services/interfaces/ITransactionService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  CreateTransactionRequestValidator,
  DeleteTransactionRequestValidator,
  GetTransactionRequestValidator,
  ListTransactionsByAccountRequestValidator,
  ListTransactionsByCategoryRequestValidator,
  ListTransactionsRequestValidator,
  UpdateTransactionRequestValidator,
} from "../../../src/validators/transactions.validator";
import {
  createControllerTestApp,
  mountControllerErrorHandler,
  TEST_USER_ID,
} from "../../helpers/controllerUnitTestUtils";

describe("TransactionController - Unit Tests", () => {
  let app: express.Application;
  let mockService: jest.Mocked<ITransactionService>;

  const transactionId = "clk7v9x1k0000qzq8x8x8x8xb";
  const accountId = "clm7v9x1k0000qzq8x8x8x8xc";
  const categoryId = "cln7v9x1k0000qzq8x8x8x8x1";
  const currencyId = "clj7v9x1k0000qzq8x8x8x8xa";

  const tx = {
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

  function buildApp(withUser = true): express.Application {
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
    const testApp = createControllerTestApp();
    const base = "/api/v1/transactions";

    if (withUser) {
      const attachUser: express.RequestHandler = (req, _res, next) => {
        req.user = { id: TEST_USER_ID, email: "test@example.com" };
        next();
      };
      testApp.use(base, attachUser);
      testApp.use("/api/v1/accounts", attachUser);
      testApp.use("/api/v1/categories", attachUser);
    }

    testApp.get(base, ListTransactionsRequestValidator, asyncHandler(controller.list));
    testApp.post(base, CreateTransactionRequestValidator, asyncHandler(controller.create));
    testApp.get(`${base}/:id`, GetTransactionRequestValidator, asyncHandler(controller.getById));
    testApp.patch(
      `${base}/:id`,
      UpdateTransactionRequestValidator,
      asyncHandler(controller.update),
    );
    testApp.delete(
      `${base}/:id`,
      DeleteTransactionRequestValidator,
      asyncHandler(controller.remove),
    );
    testApp.get(
      `/api/v1/accounts/:accountId/transactions`,
      ListTransactionsByAccountRequestValidator,
      asyncHandler(controller.listByAccount),
    );
    testApp.get(
      `/api/v1/categories/:categoryId/transactions`,
      ListTransactionsByCategoryRequestValidator,
      asyncHandler(controller.listByCategory),
    );
    mountControllerErrorHandler(testApp);
    return testApp;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  it("POST / — 201", async () => {
    mockService.createTransaction.mockResolvedValue(tx);
    const res = await request(app).post("/api/v1/transactions").send({
      accountId,
      currencyId,
      amount: 100,
      direction: "EXPENSE",
      occurredAt: "2026-05-01T12:00:00.000Z",
    });
    expect(res.status).toBe(201);
  });

  it("GET / — paginated", async () => {
    mockService.getTransactions.mockResolvedValue({
      data: [tx],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const res = await request(app).get("/api/v1/transactions");
    expect(res.status).toBe(200);
  });

  it("GET /:id", async () => {
    mockService.getTransaction.mockResolvedValue(tx);
    const res = await request(app).get(`/api/v1/transactions/${transactionId}`);
    expect(res.status).toBe(200);
  });

  it("PATCH /:id", async () => {
    mockService.updateTransaction.mockResolvedValue({ ...tx, amount: 200 });
    const res = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .send({ amount: 200 });
    expect(res.status).toBe(200);
  });

  it("DELETE /:id", async () => {
    mockService.deleteTransaction.mockResolvedValue({
      id: transactionId,
      isDeleted: true,
      deletedAt: "2026-05-02T00:00:00.000Z",
    });
    const res = await request(app).delete(`/api/v1/transactions/${transactionId}`);
    expect(res.status).toBe(200);
  });

  it("GET by account", async () => {
    mockService.getTransactionsByAccountId.mockResolvedValue({
      data: [tx],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const res = await request(app).get(`/api/v1/accounts/${accountId}/transactions`);
    expect(res.status).toBe(200);
  });

  it("GET by category", async () => {
    mockService.getTransactionsByCategoryId.mockResolvedValue({
      data: [tx],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const res = await request(app).get(`/api/v1/categories/${categoryId}/transactions`);
    expect(res.status).toBe(200);
  });

  it("без user → 401", async () => {
    app = buildApp(false);
    const res = await request(app).get("/api/v1/transactions");
    expect(res.status).toBe(401);
  });
});
