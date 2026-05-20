import type { Request, Response } from "express";
import type { IReportJobService } from "../services/interfaces/IReportJobService";
import { getServiceContext } from "../http/requestContext";
import { sendData } from "../http/response";
import { UnauthorizedError } from "../utils/errors/securityErrors";

function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();
  return userId;
}

export class ReportJobController {
  constructor(private readonly reportJobService: IReportJobService) {}

  createJob = async (req: Request, res: Response): Promise<void> => {
    const { body } = req.validated as {
      body: Parameters<IReportJobService["createJob"]>[1];
    };
    const data = await this.reportJobService.createJob(
      getUserId(req),
      body,
      getServiceContext(req),
    );
    sendData(res, req, data, 202);
  };

  getJob = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const data = await this.reportJobService.getJob(
      getUserId(req),
      params.id,
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  downloadPdf = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const buffer = await this.reportJobService.downloadPdf(
      getUserId(req),
      params.id,
      getServiceContext(req),
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report-${params.id}.pdf"`);
    res.send(buffer);
  };
}
