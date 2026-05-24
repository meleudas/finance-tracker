import type { ReportJob } from "../../generated/prisma/client";
import type {
  CreateReportJobInput,
  IReportJobRepository,
  UpdateReportJobInput,
} from "../interfaces/IReportJobRepository";
import type { RequestOptions } from "../interfaces/IBaseRepository";
import { prisma } from "../../config/prismaClient";
import { withAbortSignal } from "../../utils/helpers/withAbortSignal";

export class ReportJobRepository implements IReportJobRepository {
  async create(data: CreateReportJobInput, options?: RequestOptions): Promise<ReportJob> {
    return withAbortSignal(
      prisma.reportJob.create({
        data: {
          userId: data.userId,
          format: data.format,
          from: data.from,
          to: data.to,
          accountId: data.accountId ?? null,
          includeRecurring: data.includeRecurring,
          status: "PENDING",
        },
      }),
      options?.signal,
    );
  }

  async findByIdForUser(
    id: string,
    userId: string,
    options?: RequestOptions,
  ): Promise<ReportJob | null> {
    return withAbortSignal(
      prisma.reportJob.findFirst({
        where: { id, userId },
      }),
      options?.signal,
    );
  }

  async update(
    id: string,
    data: UpdateReportJobInput,
    options?: RequestOptions,
  ): Promise<ReportJob> {
    return withAbortSignal(
      prisma.reportJob.update({
        where: { id },
        data,
      }),
      options?.signal,
    );
  }

  async delete(id: string, options?: RequestOptions): Promise<void> {
    await withAbortSignal(
      prisma.reportJob.delete({
        where: { id },
      }),
      options?.signal,
    );
  }
}
