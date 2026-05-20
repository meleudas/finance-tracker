import request from "supertest";
import express from "express";
import { RecurringRuleController } from "../../../src/controllers/RecurringRuleController";
import type { IRecurringRuleService } from "../../../src/services/interfaces/IRecurringRuleService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import { CreateRecurringRuleRequestValidator } from "../../../src/validators/recurring-rule.validator";
import { NotFoundError } from "../../../src/utils/errors/ClientErrors";
import {
  assignTestRequestId,
  createTestAppErrorHandler,
  getResponseData,
  getResponseError,
} from "../../helpers/httpTestUtils";

describe("RecurringRuleController (Integration)", () => {
  let app: express.Application;
  let mockService: jest.Mocked<IRecurringRuleService>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const accountId = "clk7v9x1k0000qzq8x8x8x8xb";
  const currencyId = "clm7v9x1k0000qzq8x8x8x8xc";
  const frequencyId = "cln7v9x1k0000qzq8x8x8x8x1";

  const sample = {
    id: "clo7v9x1k0000qzq8x8x8x8x3",
    name: "Rent",
    accountId,
    currencyId,
    categoryId: null,
    frequencyId,
    amount: 500,
    direction: "EXPENSE" as const,
    nextRunAt: "2026-06-01T00:00:00.000Z",
    endsAt: null,
    maxOccurrences: null,
    occurrenceCount: 0,
    frequency: {
      id: frequencyId,
      name: "Monthly",
      every: 1,
      unit: "MONTH" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const createBody = {
    name: "Rent",
    accountId,
    currencyId,
    frequencyId,
    amount: 500,
    direction: "EXPENSE",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = {
      list: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<IRecurringRuleService>;

    const controller = new RecurringRuleController(mockService);
    app = express();
    app.use(express.json());
    app.use(assignTestRequestId);
    app.use("/api/v1/recurring-rules", (req, _res, next) => {
      req.user = { id: userId, email: "test@example.com" };
      next();
    });
    app.post(
      "/api/v1/recurring-rules",
      CreateRecurringRuleRequestValidator,
      asyncHandler(controller.create),
    );
    app.use(createTestAppErrorHandler());
  });

  it("POST повертає 201", async () => {
    mockService.create.mockResolvedValue(sample);

    const res = await request(app).post("/api/v1/recurring-rules").send(createBody);

    expect(res.status).toBe(201);
    const data = getResponseData(res) as typeof sample;
    expect(data.amount).toBe(500);
  });

  it("POST повертає 404 коли сервіс кидає NotFoundError", async () => {
    mockService.create.mockRejectedValue(new NotFoundError("Account"));

    const res = await request(app).post("/api/v1/recurring-rules").send(createBody);

    expect(res.status).toBe(404);
    expect(getResponseError(res).code).toBe("NOT_FOUND");
  });
});
