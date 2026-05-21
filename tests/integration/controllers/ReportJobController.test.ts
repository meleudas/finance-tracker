import request from "supertest";
import express from "express";
import { ReportJobController } from "../../../src/controllers/ReportJobController";
import type { IReportJobService } from "../../../src/services/interfaces/IReportJobService";
import { asyncHandler } from "../../../src/middleware/asyncHandler";
import {
  CreateReportJobRequestValidator,
  GetReportJobRequestValidator,
  DownloadReportJobRequestValidator,
} from "../../../src/validators/reports.validator";
import { NotFoundError } from "../../../src/utils/errors/ClientErrors";
import {
  assignTestRequestId,
  createTestAppErrorHandler,
  getResponseData,
  getResponseError,
} from "../../helpers/httpTestUtils";

describe("ReportJobController (Integration)", () => {
  let app: express.Application;
  let mockService: jest.Mocked<IReportJobService>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const jobId = "clm7v9x1k0000qzq8x8x8x8xc";
  const from = "2026-05-01T00:00:00.000Z";
  const to = "2026-05-31T23:59:59.999Z";

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      createJob: jest.fn(),
      getJob: jest.fn(),
      downloadPdf: jest.fn(),
    } as unknown as jest.Mocked<IReportJobService>;

    const controller = new ReportJobController(mockService);
    app = express();
    app.use(express.json());
    app.use(assignTestRequestId);
    app.use("/api/v1/reports", (req, _res, next) => {
      req.user = { id: userId, email: "test@example.com" };
      next();
    });
    app.post(
      "/api/v1/reports/jobs",
      CreateReportJobRequestValidator,
      asyncHandler(controller.createJob),
    );
    app.get(
      "/api/v1/reports/jobs/:id",
      GetReportJobRequestValidator,
      asyncHandler(controller.getJob),
    );
    app.get(
      "/api/v1/reports/jobs/:id/download",
      DownloadReportJobRequestValidator,
      asyncHandler(controller.downloadPdf),
    );
    app.use(createTestAppErrorHandler());
  });

  it("POST /api/v1/reports/jobs повертає 202", async () => {
    mockService.createJob.mockResolvedValue({
      id: jobId,
      status: "PENDING",
      format: "PDF",
      from,
      to,
      accountId: null,
      includeRecurring: true,
      errorMessage: null,
      createdAt: from,
      completedAt: null,
    });

    const res = await request(app).post("/api/v1/reports/jobs").send({ from, to, format: "pdf" });

    expect(res.status).toBe(202);
    const data = getResponseData(res) as { id: string; status: string };
    expect(data.id).toBe(jobId);
    expect(data.status).toBe("PENDING");
  });

  it("GET /api/v1/reports/jobs/:id повертає статус job", async () => {
    mockService.getJob.mockResolvedValue({
      id: jobId,
      status: "COMPLETED",
      format: "JSON",
      from,
      to,
      accountId: null,
      includeRecurring: true,
      errorMessage: null,
      createdAt: from,
      completedAt: to,
      data: {
        period: { from, to },
        filters: { includeRecurring: true },
        currencies: [],
      },
    });

    const res = await request(app).get(`/api/v1/reports/jobs/${jobId}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res) as { status: string };
    expect(data.status).toBe("COMPLETED");
  });

  it("GET /api/v1/reports/jobs/:id повертає 404 для відсутнього job", async () => {
    mockService.getJob.mockRejectedValue(new NotFoundError("Report job"));

    const res = await request(app).get(`/api/v1/reports/jobs/${jobId}`);

    expect(res.status).toBe(404);
    expect(getResponseError(res).code).toBe("NOT_FOUND");
  });

  it("GET /api/v1/reports/jobs/:id/download повертає PDF", async () => {
    mockService.downloadPdf.mockResolvedValue(Buffer.from("%PDF-1.4 test"));

    const res = await request(app).get(`/api/v1/reports/jobs/${jobId}/download`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/pdf/);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
