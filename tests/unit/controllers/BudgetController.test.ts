import request from "supertest";
import express from "express";
import { BudgetController } from "../../../src/controllers/BudgetController";
import type { IBudgetService } from "../../../src/services/interfaces/IBudgetService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  BudgetProgressQueryValidator,
  CreateBudgetRequestValidator,
  DeleteBudgetRequestValidator,
  GetBudgetRequestValidator,
  ListBudgetsRequestValidator,
  UpdateBudgetLimitRequestValidator,
  UpdateBudgetRequestValidator,
} from "../../../src/validators/budget.validator";
import {
  createControllerTestApp,
  mountControllerErrorHandler,
  TEST_USER_ID,
} from "../../helpers/controllerUnitTestUtils";

describe("BudgetController - Unit Tests", () => {
  let app: express.Application;
  let mockService: jest.Mocked<IBudgetService>;

  const budgetId = "clk7v9x1k0000qzq8x8x8x8xb";
  const accountId = "clh7v9x1k0000qzq8x8x8x8x9";
  const currencyId = "clj7v9x1k0000qzq8x8x8x8xa";

  const budgetRow = {
    id: budgetId,
    name: "Food",
    accountId,
    currencyId,
    categoryId: null,
    limitAmount: 1000,
    periodStart: "2026-05-01T00:00:00.000Z",
    periodEnd: "2026-05-31T23:59:59.999Z",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    deletedAt: null,
    isDeleted: false,
  };

  function buildApp(withUser = true): express.Application {
    mockService = {
      listBudgets: jest.fn(),
      getBudgetById: jest.fn(),
      createBudget: jest.fn(),
      updateBudget: jest.fn(),
      updateBudgetLimit: jest.fn(),
      deleteBudget: jest.fn(),
      getBudgetsProgress: jest.fn(),
    } as unknown as jest.Mocked<IBudgetService>;

    const controller = new BudgetController(mockService);
    const testApp = createControllerTestApp();
    const base = "/api/v1/budgets";

    if (withUser) {
      testApp.use(base, (req, _res, next) => {
        req.user = { id: TEST_USER_ID, email: "test@example.com" };
        next();
      });
    }

    testApp.get(base, ListBudgetsRequestValidator, asyncHandler(controller.list));
    testApp.get(
      `${base}/progress`,
      BudgetProgressQueryValidator,
      asyncHandler(controller.getProgress),
    );
    testApp.get(`${base}/:id`, GetBudgetRequestValidator, asyncHandler(controller.getById));
    testApp.post(base, CreateBudgetRequestValidator, asyncHandler(controller.create));
    testApp.patch(`${base}/:id`, UpdateBudgetRequestValidator, asyncHandler(controller.update));
    testApp.patch(
      `${base}/:id/limit`,
      UpdateBudgetLimitRequestValidator,
      asyncHandler(controller.updateLimit),
    );
    testApp.delete(`${base}/:id`, DeleteBudgetRequestValidator, asyncHandler(controller.remove));
    mountControllerErrorHandler(testApp);
    return testApp;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  it("GET / — paginated list", async () => {
    mockService.listBudgets.mockResolvedValue({
      data: [budgetRow],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await request(app).get("/api/v1/budgets");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("GET /:id — budget by id", async () => {
    mockService.getBudgetById.mockResolvedValue(budgetRow);

    const res = await request(app).get(`/api/v1/budgets/${budgetId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(budgetId);
  });

  it("POST / — create 201", async () => {
    mockService.createBudget.mockResolvedValue(budgetRow);

    const res = await request(app).post("/api/v1/budgets").send({
      accountId,
      currencyId,
      name: "Food",
      periodStart: "2026-05-01T00:00:00.000Z",
      periodEnd: "2026-05-31T23:59:59.999Z",
      limitAmount: 1000,
    });

    expect(res.status).toBe(201);
  });

  it("PATCH /:id — update", async () => {
    mockService.updateBudget.mockResolvedValue({ ...budgetRow, name: "Groceries" });

    const res = await request(app).patch(`/api/v1/budgets/${budgetId}`).send({ name: "Groceries" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Groceries");
  });

  it("PATCH /:id/limit — update limit", async () => {
    mockService.updateBudgetLimit.mockResolvedValue({ ...budgetRow, limitAmount: 2000 });

    const res = await request(app)
      .patch(`/api/v1/budgets/${budgetId}/limit`)
      .send({ limitAmount: 2000 });

    expect(res.status).toBe(200);
    expect(res.body.data.limitAmount).toBe(2000);
  });

  it("DELETE /:id — remove", async () => {
    mockService.deleteBudget.mockResolvedValue({
      id: budgetId,
      isDeleted: true,
      deletedAt: "2026-05-02T00:00:00.000Z",
    });

    const res = await request(app).delete(`/api/v1/budgets/${budgetId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isDeleted).toBe(true);
  });

  it("GET /progress — default date", async () => {
    mockService.getBudgetsProgress.mockResolvedValue([]);

    const res = await request(app).get("/api/v1/budgets/progress");

    expect(res.status).toBe(200);
    expect(mockService.getBudgetsProgress).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.any(Date),
      expect.any(Object),
    );
  });

  describe("UnauthorizedError", () => {
    beforeEach(() => {
      app = buildApp(false);
    });

    it("GET / без user → 401", async () => {
      const res = await request(app).get("/api/v1/budgets");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
