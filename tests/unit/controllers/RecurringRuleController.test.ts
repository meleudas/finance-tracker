import request from "supertest";
import express from "express";
import { RecurringRuleController } from "../../../src/controllers/RecurringRuleController";
import type { IRecurringRuleService } from "../../../src/services/interfaces/IRecurringRuleService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  CreateRecurringRuleRequestValidator,
  DeleteRecurringRuleRequestValidator,
  GetRecurringRuleRequestValidator,
  ListRecurringRulesRequestValidator,
  UpdateRecurringRuleRequestValidator,
} from "../../../src/validators/recurring-rule.validator";
import {
  createControllerTestApp,
  mountControllerErrorHandler,
  TEST_USER_ID,
} from "../../helpers/controllerUnitTestUtils";

describe("RecurringRuleController - Unit Tests", () => {
  let app: express.Application;
  let mockService: jest.Mocked<IRecurringRuleService>;

  const ruleId = "clk7v9x1k0000qzq8x8x8x8xb";
  const accountId = "clm7v9x1k0000qzq8x8x8x8xc";
  const currencyId = "clj7v9x1k0000qzq8x8x8x8xa";
  const frequencyId = "cln7v9x1k0000qzq8x8x8x8x1";
  const rule = {
    id: ruleId,
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

  function buildApp(withUser = true): express.Application {
    mockService = {
      list: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<IRecurringRuleService>;

    const controller = new RecurringRuleController(mockService);
    const testApp = createControllerTestApp();
    const base = "/api/v1/recurring-rules";

    if (withUser) {
      testApp.use(base, (req, _res, next) => {
        req.user = { id: TEST_USER_ID, email: "test@example.com" };
        next();
      });
    }

    testApp.get(base, ListRecurringRulesRequestValidator, asyncHandler(controller.list));
    testApp.post(base, CreateRecurringRuleRequestValidator, asyncHandler(controller.create));
    testApp.get(`${base}/:id`, GetRecurringRuleRequestValidator, asyncHandler(controller.getById));
    testApp.patch(
      `${base}/:id`,
      UpdateRecurringRuleRequestValidator,
      asyncHandler(controller.update),
    );
    testApp.delete(
      `${base}/:id`,
      DeleteRecurringRuleRequestValidator,
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
      data: [rule],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const res = await request(app).get("/api/v1/recurring-rules");
    expect(res.status).toBe(200);
  });

  it("GET /:id", async () => {
    mockService.getById.mockResolvedValue(rule);
    const res = await request(app).get(`/api/v1/recurring-rules/${ruleId}`);
    expect(res.status).toBe(200);
  });

  it("POST / — 201", async () => {
    mockService.create.mockResolvedValue(rule);
    const res = await request(app).post("/api/v1/recurring-rules").send({
      name: "Rent",
      direction: "EXPENSE",
      amount: 500,
      accountId,
      currencyId,
      frequencyId,
    });
    expect(res.status).toBe(201);
  });

  it("PATCH /:id", async () => {
    mockService.update.mockResolvedValue({ ...rule, name: "Updated" });
    const res = await request(app)
      .patch(`/api/v1/recurring-rules/${ruleId}`)
      .send({ name: "Updated" });
    expect(res.status).toBe(200);
  });

  it("DELETE /:id", async () => {
    mockService.remove.mockResolvedValue({
      id: ruleId,
      isDeleted: true,
      deletedAt: "2026-05-02T00:00:00.000Z",
    });
    const res = await request(app).delete(`/api/v1/recurring-rules/${ruleId}`);
    expect(res.status).toBe(200);
  });

  it("без user → 401", async () => {
    app = buildApp(false);
    const res = await request(app).get("/api/v1/recurring-rules");
    expect(res.status).toBe(401);
  });
});
