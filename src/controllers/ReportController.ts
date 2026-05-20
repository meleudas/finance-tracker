import type { Request, Response } from "express";
import type { IReportService } from "../services/interfaces/IReportService";
import type { ReportQueryDto } from "../dtos/report/ReportQuery.dto";
import { getServiceContext } from "../http/requestContext";
import { sendData } from "../http/response";
import { UnauthorizedError } from "../utils/errors/securityErrors";

function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export class ReportController {
  constructor(private readonly reportService: IReportService) {}

  getReport = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.validated as { query: ReportQueryDto };
    const data = await this.reportService.getFinancialReport(
      getUserId(req),
      query,
      getServiceContext(req),
    );
    sendData(res, req, data);
  };
}
