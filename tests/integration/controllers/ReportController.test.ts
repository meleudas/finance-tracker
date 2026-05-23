import request from "supertest";
import express from "express";
import { ReportController } from "../../../src/controllers/ReportController";
import type { IReportService } from "../../../src/services/interfaces/IReportService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import { GetFinancialReportRequestValidator } from "../../../src/validators/reports.validator";
import { NotFoundError } from "../../../src/utils/errors/ClientErrors";
import {
  assignTestRequestId,
  createTestAppErrorHandler,
  getResponseData,
  getResponseError,
} from "../../helpers/httpTestUtils";

describe("ReportController (Integration)", () => {
  let app: express.Application;
  let mockService: jest.Mocked<IReportService>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const from = "2026-05-01T00:00:00.000Z";
  const to = "2026-05-31T23:59:59.999Z";

  const sampleReport = {
    period: { from, to },
    filters: {},
    currencies: [
      {
        currencyId: "clm7v9x1k0000qzq8x8x8x8xc",
        currencyCode: "UAH",
        summary: { totalIncome: 100, totalExpense: 50, net: 50 },
        byCategory: [],
        byAccount: [],
        transfers: { count: 0, totalAmount: 0 },
        budgets: [],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      getFinancialReport: jest.fn(),
    } as unknown as jest.Mocked<IReportService>;

    const controller = new ReportController(mockService);
    app = express();
    app.use(express.json());
    app.use(assignTestRequestId);
    app.use("/api/v1/reports", (req, _res, next) => {
      req.user = { id: userId, email: "test@example.com" };
      next();
    });
    app.get(
      "/api/v1/reports",
      GetFinancialReportRequestValidator,
      asyncHandler(controller.getReport),
    );
    app.use(createTestAppErrorHandler());
  });

  it("GET /api/v1/reports повертає 200 з envelope", async () => {
    mockService.getFinancialReport.mockResolvedValue(sampleReport);

    const res = await request(app).get("/api/v1/reports").query({ from, to });

    expect(res.status).toBe(200);
    const data = getResponseData(res) as typeof sampleReport;
    expect(data.currencies).toHaveLength(1);
    expect(data.currencies[0]?.summary.net).toBe(50);
    expect(mockService.getFinancialReport).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        from: expect.any(Date),
        to: expect.any(Date),
      }),
      { signal: undefined },
    );
  });

  it("GET /api/v1/reports повертає 400 без from/to", async () => {
    const res = await request(app).get("/api/v1/reports");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    const messages = (res.body.details as { message: string }[]).map((d) => d.message);
    expect(messages.some((m) => m.includes("from is required"))).toBe(true);
    expect(messages.some((m) => m.includes("to is required"))).toBe(true);
  });

  it("GET /api/v1/reports повертає 400 при from > to", async () => {
    const res = await request(app).get("/api/v1/reports").query({ from: to, to: from });

    expect(res.status).toBe(400);
  });

  it("GET /api/v1/reports повертає 404 для чужого рахунку", async () => {
    mockService.getFinancialReport.mockRejectedValue(new NotFoundError("Account"));

    const res = await request(app)
      .get("/api/v1/reports")
      .query({ from, to, accountId: "clk7v9x1k0000qzq8x8x8x8xb" });

    expect(res.status).toBe(404);
    expect(getResponseError(res).code).toBe("NOT_FOUND");
  });
});
