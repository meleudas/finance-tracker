import type { Request, Response } from "express";
import { ReportController } from "../../../src/controllers/ReportController";
import type { IReportService } from "../../../src/services/interfaces/IReportService";
import { UnauthorizedError } from "../../../src/utils/errors/securityErrors";

describe("ReportController unit", () => {
  it("getReport кидає UnauthorizedError без user", async () => {
    const mockService = {
      getFinancialReport: jest.fn(),
    } as unknown as IReportService;
    const controller = new ReportController(mockService);
    const req = {
      validated: {
        query: { from: "2026-05-01T00:00:00.000Z", to: "2026-05-31T23:59:59.999Z" },
      },
    } as unknown as Request;
    const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;

    await expect(controller.getReport(req, res)).rejects.toThrow(UnauthorizedError);
    expect(mockService.getFinancialReport).not.toHaveBeenCalled();
  });
});
