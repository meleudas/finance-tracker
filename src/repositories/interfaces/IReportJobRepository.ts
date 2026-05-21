import type { Prisma, ReportJob, ReportJobStatus } from "../../generated/prisma/client";
import type { RequestOptions } from "./IBaseRepository";

export interface CreateReportJobInput {
  userId: string;
  format: "JSON" | "PDF";
  from: Date;
  to: Date;
  accountId?: string;
  includeRecurring: boolean;
}

export interface UpdateReportJobInput {
  status?: ReportJobStatus;
  resultJson?: Prisma.InputJsonValue;
  storageKey?: string | null;
  errorMessage?: string | null;
  completedAt?: Date | null;
}

export interface IReportJobRepository {
  create(data: CreateReportJobInput, options?: RequestOptions): Promise<ReportJob>;

  findByIdForUser(id: string, userId: string, options?: RequestOptions): Promise<ReportJob | null>;

  update(id: string, data: UpdateReportJobInput, options?: RequestOptions): Promise<ReportJob>;
}
