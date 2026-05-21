import request from "supertest";
import express from "express";
import { RecurringFrequencyController } from "../../../src/controllers/RecurringFrequencyController";
import type { IRecurringFrequencyService } from "../../../src/services/interfaces/IRecurringFrequencyService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  CreateRecurringFrequencyRequestValidator,
  ListRecurringFrequenciesRequestValidator,
} from "../../../src/validators/recurring-frequency.validator";
import {
  assignTestRequestId,
  createTestAppErrorHandler,
  getResponseData,
} from "../../helpers/httpTestUtils";

describe("RecurringFrequencyController (Integration)", () => {
  let app: express.Application;
  let mockService: jest.Mocked<IRecurringFrequencyService>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const sample = {
    id: "clm7v9x1k0000qzq8x8x8x8xc",
    name: "Monthly",
    every: 1,
    unit: "MONTH" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = {
      list: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<IRecurringFrequencyService>;

    const controller = new RecurringFrequencyController(mockService);
    app = express();
    app.use(express.json());
    app.use(assignTestRequestId);
    app.use("/api/v1/recurring-frequencies", (req, _res, next) => {
      req.user = { id: userId, email: "test@example.com" };
      next();
    });
    app.post(
      "/api/v1/recurring-frequencies",
      CreateRecurringFrequencyRequestValidator,
      asyncHandler(controller.create),
    );
    app.get(
      "/api/v1/recurring-frequencies",
      ListRecurringFrequenciesRequestValidator,
      asyncHandler(controller.list),
    );
    app.use(createTestAppErrorHandler());
  });

  it("POST повертає 201", async () => {
    mockService.create.mockResolvedValue(sample);

    const res = await request(app)
      .post("/api/v1/recurring-frequencies")
      .send({ name: "Monthly", every: 1, unit: "MONTH" });

    expect(res.status).toBe(201);
    const data = getResponseData(res) as typeof sample;
    expect(data.name).toBe("Monthly");
  });

  it("POST повертає 400 при невалідному every", async () => {
    const res = await request(app)
      .post("/api/v1/recurring-frequencies")
      .send({ name: "Bad", every: 0, unit: "MONTH" });

    expect(res.status).toBe(400);
  });
});
