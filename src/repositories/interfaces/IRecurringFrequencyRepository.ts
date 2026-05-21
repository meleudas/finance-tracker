import type { RecurringFrequency } from "../../generated/prisma/client";
import type {
  IBaseRepository,
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "./IBaseRepository";

export interface RecurringFrequencyFilter {
  userId: string;
  name?: string;
}

export interface IRecurringFrequencyRepository extends IBaseRepository<RecurringFrequency> {
  findByIdForUser(
    id: string,
    userId: string,
    options?: RequestOptions,
  ): Promise<RecurringFrequency | null>;

  findByFilter(
    filter: RecurringFrequencyFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<RecurringFrequency>>;

  countActiveRules(frequencyId: string, options?: RequestOptions): Promise<number>;
}
