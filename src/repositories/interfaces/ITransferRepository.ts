import type { Transfer } from "../../generated/prisma/client";
import type {
  IBaseRepository,
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "./IBaseRepository";

export interface TransferFilter {
  userId: string;
  accountId?: string;
  currencyId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  from?: Date;
  to?: Date;
}

export interface TransferAccountAggregate {
  accountId: string;
  transfersIn: number;
  transfersOut: number;
}

export interface TransferSummary {
  count: number;
  totalAmount: number;
}

export interface ITransferRepository extends IBaseRepository<Transfer> {
  findByUserId(
    userId: string,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Transfer>>;
  findByFilter(
    filter: TransferFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Transfer>>;
  findByAccountId(accountId: string, options?: RequestOptions): Promise<Transfer[]>;

  aggregateByAccount(
    filter: TransferFilter,
    options?: RequestOptions,
  ): Promise<TransferAccountAggregate[]>;
  countAndSum(filter: TransferFilter, options?: RequestOptions): Promise<TransferSummary>;
}
