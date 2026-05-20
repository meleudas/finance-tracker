import type { Account } from "../../generated/prisma/client";
import type {
  IBaseRepository,
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "./IBaseRepository";

export interface AccountFilter {
  userId: string;
  currencyId?: string;
  isDeleted?: boolean;
}

export interface IAccountRepository extends IBaseRepository<Account> {
  create(
    data: Omit<Account, "id" | "createdAt" | "updatedAt" | "isDeleted">,
    options?: RequestOptions,
  ): Promise<Account>;
  update(id: string, data: Partial<Account>, options?: RequestOptions): Promise<Account>;
  softDelete(id: string, options?: RequestOptions): Promise<Account>;
  findById(id: string, options?: RequestOptions): Promise<Account | null>;
  findByUserId(
    userId: string,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Account>>;
  findByFilter(
    filter: AccountFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Account>>;
}
