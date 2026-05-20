import type { FinancialReportDto } from "../../dtos/report/FinancialReport.dto";
import type { ReportQueryDto } from "../../dtos/report/ReportQuery.dto";
import type { ServiceContext } from "../serviceContext";

export interface IReportService {
  getFinancialReport(
    userId: string,
    query: ReportQueryDto,
    ctx?: ServiceContext,
  ): Promise<FinancialReportDto>;

  buildFinancialReport(
    userId: string,
    query: ReportQueryDto,
    ctx?: ServiceContext,
  ): Promise<FinancialReportDto>;
}
