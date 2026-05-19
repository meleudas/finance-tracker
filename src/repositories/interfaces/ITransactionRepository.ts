import type { Transaction, TransactionDirection } from "../../generated/prisma/client";
import type {
  IBaseRepository,
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "./IBaseRepository";

export interface TransactionFilter {
  userId: string;
  accountId?: string;
  categoryId?: string;
  direction?: TransactionDirection;
  from?: Date;
  to?: Date;
}

export interface ITransactionRepository extends IBaseRepository<Transaction> {
  findByUserId(
    userId: string,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Transaction>>;
  findByFilter(
    filter: TransactionFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Transaction>>;
  findByAccountId(accountId: string, options?: RequestOptions): Promise<Transaction[]>;
  findByCategoryId(categoryId: string, options?: RequestOptions): Promise<Transaction[]>;
}
