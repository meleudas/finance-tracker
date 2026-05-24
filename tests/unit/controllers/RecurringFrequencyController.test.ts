import request from "supertest";
import express from "express";
import { RecurringFrequencyController } from "../../../src/controllers/RecurringFrequencyController";
import type { IRecurringFrequencyService } from "../../../src/services/interfaces/IRecurringFrequencyService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  CreateRecurringFrequencyRequestValidator,
  DeleteRecurringFrequencyRequestValidator,
  GetRecurringFrequencyRequestValidator,
  ListRecurringFrequenciesRequestValidator,
  UpdateRecurringFrequencyRequestValidator,
} from "../../../src/validators/recurring-frequency.validator";
import {
  createControllerTestApp,
  mountControllerErrorHandler,
  TEST_USER_ID,
} from "../../helpers/controllerUnitTestUtils";

describe("RecurringFrequencyController - Unit Tests", () => {
  let app: express.Application;
  let mockService: jest.Mocked<IRecurringFrequencyService>;

  const frequencyId = "clk7v9x1k0000qzq8x8x8x8xb";
  const frequency = {
    id: frequencyId,
    name: "Monthly",
    every: 1,
    unit: "MONTH" as const,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    deletedAt: null,
    isDeleted: false,
  };

  function buildApp(withUser = true): express.Application {
    mockService = {
      list: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<IRecurringFrequencyService>;

    const controller = new RecurringFrequencyController(mockService);
    const testApp = createControllerTestApp();
    const base = "/api/v1/recurring-frequencies";

    if (withUser) {
      testApp.use(base, (req, _res, next) => {
        req.user = { id: TEST_USER_ID, email: "test@example.com" };
        next();
      });
    }

    testApp.get(base, ListRecurringFrequenciesRequestValidator, asyncHandler(controller.list));
    testApp.post(base, CreateRecurringFrequencyRequestValidator, asyncHandler(controller.create));
    testApp.get(
      `${base}/:id`,
      GetRecurringFrequencyRequestValidator,
      asyncHandler(controller.getById),
    );
    testApp.patch(
      `${base}/:id`,
      UpdateRecurringFrequencyRequestValidator,
      asyncHandler(controller.update),
    );
    testApp.delete(
      `${base}/:id`,
      DeleteRecurringFrequencyRequestValidator,
      asyncHandler(controller.remove),
    );
    mountControllerErrorHandler(testApp);
    return testApp;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  it("GET / — paginated", async () => {
    mockService.list.mockResolvedValue({
      data: [frequency],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const res = await request(app).get("/api/v1/recurring-frequencies");
    expect(res.status).toBe(200);
  });

  it("GET /:id", async () => {
    mockService.getById.mockResolvedValue(frequency);
    const res = await request(app).get(`/api/v1/recurring-frequencies/${frequencyId}`);
    expect(res.status).toBe(200);
  });

  it("POST / — 201", async () => {
    mockService.create.mockResolvedValue(frequency);
    const res = await request(app)
      .post("/api/v1/recurring-frequencies")
      .send({ name: "Monthly", every: 1, unit: "MONTH" });
    expect(res.status).toBe(201);
  });

  it("PATCH /:id", async () => {
    mockService.update.mockResolvedValue({ ...frequency, name: "Bi-weekly" });
    const res = await request(app)
      .patch(`/api/v1/recurring-frequencies/${frequencyId}`)
      .send({ name: "Bi-weekly" });
    expect(res.status).toBe(200);
  });

  it("DELETE /:id", async () => {
    mockService.remove.mockResolvedValue({
      id: frequencyId,
      isDeleted: true,
      deletedAt: "2026-05-02T00:00:00.000Z",
    });
    const res = await request(app).delete(`/api/v1/recurring-frequencies/${frequencyId}`);
    expect(res.status).toBe(200);
  });

  it("без user → 401", async () => {
    app = buildApp(false);
    const res = await request(app).get("/api/v1/recurring-frequencies");
    expect(res.status).toBe(401);
  });
});
