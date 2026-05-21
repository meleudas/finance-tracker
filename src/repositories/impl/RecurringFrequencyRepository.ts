import type { RecurringFrequency } from "../../generated/prisma/client";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import type {
  IRecurringFrequencyRepository,
  RecurringFrequencyFilter,
} from "../interfaces/IRecurringFrequencyRepository";
import type {
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "../interfaces/IBaseRepository";
import { withAbortSignal } from "../../utils/helpers/withAbortSignal";

export class RecurringFrequencyRepository
  extends BaseRepository<RecurringFrequency>
  implements IRecurringFrequencyRepository
{
  protected get delegate(): PrismaDelegate {
    return this.prisma.recurringFrequency as unknown as PrismaDelegate;
  }

  async findByIdForUser(
    id: string,
    userId: string,
    options?: RequestOptions,
  ): Promise<RecurringFrequency | null> {
    return withAbortSignal(
      this.prisma.recurringFrequency.findFirst({
        where: { id, userId, isDeleted: false },
      }),
      options?.signal,
    );
  }

  async findByFilter(
    filter: RecurringFrequencyFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<RecurringFrequency>> {
    const limit = Math.min(Math.max(1, pagination.limit), 100);
    const page = Math.max(1, pagination.page);
    const skip = (page - 1) * limit;

    const where = {
      userId: filter.userId,
      isDeleted: false,
      ...(filter.name && {
        name: { contains: filter.name, mode: "insensitive" as const },
      }),
    };

    const [data, total] = await withAbortSignal(
      Promise.all([
        this.prisma.recurringFrequency.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
        }),
        this.prisma.recurringFrequency.count({ where }),
      ]),
      options?.signal,
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async countActiveRules(frequencyId: string, options?: RequestOptions): Promise<number> {
    return withAbortSignal(
      this.prisma.recurringRule.count({
        where: { frequencyId, isDeleted: false },
      }),
      options?.signal,
    );
  }
}
