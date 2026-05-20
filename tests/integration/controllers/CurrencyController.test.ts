import request from "supertest";
import express from "express";
import { CurrencyController } from "../../../src/controllers/CurrencyController";
import type { ICurrencyService } from "../../../src/services/interfaces/ICurrencyService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  GetCurrencyByCodeRequestValidator,
  GetCurrencyByIdRequestValidator,
  ListCurrenciesRequestValidator,
} from "../../../src/validators/currency.validator";
import { AppError } from "../../../src/utils/errors/appError";
import { NotFoundError } from "../../../src/utils/errors/ClientErrors";

describe("CurrencyController (Integration)", () => {
  let app: express.Application;
  let mockService: jest.Mocked<ICurrencyService>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const currencyId = "clk7v9x1k0000qzq8x8x8x8xb";

  const currencyEntity = {
    id: currencyId,
    code: "EUR",
    name: "Euro",
    minorUnits: 2,
    isDeleted: false,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      getAllCurrencies: jest.fn(),
      getCurrencyByCode: jest.fn(),
      getCurrencyById: jest.fn(),
    } as unknown as jest.Mocked<ICurrencyService>;

    const controller = new CurrencyController(mockService);
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.id = "test-request-id";
      next();
    });

    app.use("/api/v1/currencies", (req, _res, next) => {
      req.user = { id: userId, email: "test@example.com" };
      next();
    });

    app.get(
      "/api/v1/currencies/code/:code",
      GetCurrencyByCodeRequestValidator,
      asyncHandler(controller.getByCode),
    );
    app.get(
      "/api/v1/currencies/:id",
      GetCurrencyByIdRequestValidator,
      asyncHandler(controller.getById),
    );
    app.get("/api/v1/currencies", ListCurrenciesRequestValidator, asyncHandler(controller.list));

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

  describe("GET /api/v1/currencies", () => {
    it("should return list envelope", async () => {
      mockService.getAllCurrencies.mockResolvedValue([
        { ...currencyEntity, code: "UAH", name: "Hryvnia" },
        currencyEntity,
      ] as never);

      const res = await request(app).get("/api/v1/currencies");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).not.toHaveProperty("isDeleted");
      expect(res.body.meta.requestId).toBe("test-request-id");
    });
  });

  describe("GET /api/v1/currencies/code/:code", () => {
    it("should return currency by code in envelope", async () => {
      mockService.getCurrencyByCode.mockResolvedValue(currencyEntity as never);

      const res = await request(app).get("/api/v1/currencies/code/EUR");

      expect(res.status).toBe(200);
      expect(res.body.data.code).toBe("EUR");
      expect(mockService.getCurrencyByCode).toHaveBeenCalledWith("EUR", expect.any(Object));
    });

    it("should forward 404 from service", async () => {
      mockService.getCurrencyByCode.mockRejectedValue(
        new NotFoundError("Currency with code XXX not found"),
      );

      const res = await request(app).get("/api/v1/currencies/code/XXX");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/currencies/:id", () => {
    it("should return currency by id in envelope", async () => {
      mockService.getCurrencyById.mockResolvedValue(currencyEntity as never);

      const res = await request(app).get(`/api/v1/currencies/${currencyId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(currencyId);
      expect(mockService.getCurrencyById).toHaveBeenCalledWith(currencyId, expect.any(Object));
    });
  });
});
