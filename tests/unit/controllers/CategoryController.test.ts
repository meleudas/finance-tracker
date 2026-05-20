import request from "supertest";
import express from "express";
import { CategoryController } from "../../../src/controllers/CategoryController";
import type { ICategoryService } from "../../../src/services/interfaces/ICategoryService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  CreateCategoryRequestValidator,
  DeleteCategoryRequestValidator,
  GetCategoryRequestValidator,
  UpdateCategoryRequestValidator,
} from "../../../src/validators/category.validator";
import { AppError } from "../../../src/utils/errors/appError";
import { ConflictError } from "../../../src/utils/errors/ClientErrors";

describe("CategoryController - Unit Tests", () => {
  let app: express.Application;
  let mockService: jest.Mocked<ICategoryService>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const categoryId = "clk7v9x1k0000qzq8x8x8x8xb";

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      getCategoryTree: jest.fn(),
      getCategoryById: jest.fn(),
    } as unknown as jest.Mocked<ICategoryService>;

    const controller = new CategoryController(mockService);
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.id = "test-request-id";
      next();
    });

    app.use("/api/v1/categories", (req, _res, next) => {
      req.user = { id: userId, email: "test@example.com" };
      next();
    });

    app.post("/api/v1/categories", CreateCategoryRequestValidator, asyncHandler(controller.create));
    app.get("/api/v1/categories", asyncHandler(controller.list));
    app.get(
      "/api/v1/categories/:id",
      GetCategoryRequestValidator,
      asyncHandler(controller.getById),
    );
    app.patch(
      "/api/v1/categories/:id",
      UpdateCategoryRequestValidator,
      asyncHandler(controller.update),
    );
    app.delete(
      "/api/v1/categories/:id",
      DeleteCategoryRequestValidator,
      asyncHandler(controller.remove),
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

  describe("POST /api/v1/categories", () => {
    it("should create category and return 201 with envelope", async () => {
      mockService.createCategory.mockResolvedValue({
        id: categoryId,
        userId,
        name: "Food",
        kind: "EXPENSE",
        parentId: null,
        isDeleted: false,
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
        updatedAt: new Date("2026-05-01T00:00:00.000Z"),
        deletedAt: null,
      });

      const res = await request(app)
        .post("/api/v1/categories")
        .send({ name: "Food", kind: "EXPENSE" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Food");
      expect(mockService.createCategory).toHaveBeenCalledWith(
        userId,
        { name: "Food", kind: "EXPENSE" },
        expect.objectContaining({ signal: undefined }),
      );
    });
  });

  describe("GET /api/v1/categories", () => {
    it("should return category tree envelope", async () => {
      mockService.getCategoryTree.mockResolvedValue([
        {
          id: categoryId,
          userId,
          name: "Food",
          kind: "EXPENSE",
          parentId: null,
          isDeleted: false,
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z"),
          deletedAt: null,
          children: [],
        },
      ]);

      const res = await request(app).get("/api/v1/categories");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].children).toEqual([]);
    });
  });

  describe("PATCH /api/v1/categories/:id", () => {
    it("should update category via validated body", async () => {
      mockService.updateCategory.mockResolvedValue({
        id: categoryId,
        userId,
        name: "Groceries",
        kind: "EXPENSE",
        parentId: null,
        isDeleted: false,
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
        updatedAt: new Date("2026-05-02T00:00:00.000Z"),
        deletedAt: null,
      });

      const res = await request(app)
        .patch(`/api/v1/categories/${categoryId}`)
        .send({ name: "Groceries" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Groceries");
      expect(mockService.updateCategory).toHaveBeenCalledWith(
        userId,
        categoryId,
        { name: "Groceries" },
        expect.any(Object),
      );
    });
  });

  describe("DELETE /api/v1/categories/:id", () => {
    it("should return 200 delete envelope on success", async () => {
      mockService.deleteCategory.mockResolvedValue(undefined);

      const res = await request(app).delete(`/api/v1/categories/${categoryId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(categoryId);
      expect(res.body.data.isDeleted).toBe(true);
    });

    it("should forward ConflictError as 409", async () => {
      mockService.deleteCategory.mockRejectedValue(
        new ConflictError(
          "Cannot delete category with active financial history. Reassign transactions first.",
        ),
      );

      const res = await request(app).delete(`/api/v1/categories/${categoryId}`);

      expect(res.status).toBe(409);
    });
  });
});
