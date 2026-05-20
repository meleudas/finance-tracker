import type { CreateReportJobDto } from "../../dtos/report/CreateReportJob.dto";
import type { ReportJobResponseDto } from "../../dtos/report/ReportJobResponse.dto";
import type { ServiceContext } from "../serviceContext";

export interface IReportJobService {
  createJob(
    userId: string,
    dto: CreateReportJobDto,
    ctx?: ServiceContext,
  ): Promise<ReportJobResponseDto>;

  getJob(userId: string, jobId: string, ctx?: ServiceContext): Promise<ReportJobResponseDto>;

  downloadPdf(userId: string, jobId: string, ctx?: ServiceContext): Promise<Buffer>;
}
