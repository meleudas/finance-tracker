import request from "supertest";
import express from "express";
import { BudgetController } from "../../../src/controllers/BudgetController";
import type { IBudgetService } from "../../../src/services/interfaces/IBudgetService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  BudgetProgressQueryValidator,
  CreateBudgetRequestValidator,
} from "../../../src/validators/budget.validator";
import { AppError } from "../../../src/utils/errors/appError";
describe("BudgetController (Integration)", () => {
  let app: express.Application;
  let mockService: jest.Mocked<IBudgetService>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const accountId = "clh7v9x1k0000qzq8x8x8x8x9";
  const currencyId = "clj7v9x1k0000qzq8x8x8x8xa";
  const budgetId = "clk7v9x1k0000qzq8x8x8x8xb";

  beforeEach(() => {
    jest.clearAllMocks();

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
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.id = "test-request-id";
      next();
    });

    app.use("/api/v1/budgets", (req, _res, next) => {
      req.user = { id: userId, email: "test@example.com" };
      next();
    });

    app.post("/api/v1/budgets", CreateBudgetRequestValidator, asyncHandler(controller.create));
    app.get(
      "/api/v1/budgets/progress",
      BudgetProgressQueryValidator,
      asyncHandler(controller.getProgress),
    );

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

  describe("POST /api/v1/budgets", () => {
    it("should create budget and return 201 with envelope", async () => {
      mockService.createBudget.mockResolvedValue({
        id: budgetId,
        name: "Test",
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
      });

      const res = await request(app).post("/api/v1/budgets").send({
        accountId,
        currencyId,
        name: "Test Budget",
        periodStart: "2026-05-01T00:00:00.000Z",
        periodEnd: "2026-05-31T23:59:59.999Z",
        limitAmount: 1000,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Test");
      expect(mockService.createBudget).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ name: "Test Budget" }),
        expect.anything(),
      );
    });

    it("should return 400 when validation fails", async () => {
      const res = await request(app).post("/api/v1/budgets").send({});
      expect(res.status).toBe(400);
      expect(mockService.createBudget).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/budgets/progress", () => {
    it("should return progress list in envelope", async () => {
      mockService.getBudgetsProgress.mockResolvedValue([
        {
          id: budgetId,
          name: "Food",
          limitAmount: 500,
          spentAmount: 100,
          remainingAmount: 400,
          isExceeded: false,
          periodStart: "2026-05-01T00:00:00.000Z",
          periodEnd: "2026-05-31T23:59:59.999Z",
          accountId,
          categoryId: null,
          currencyCode: "UAH",
        },
      ]);

      const res = await request(app).get("/api/v1/budgets/progress");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
