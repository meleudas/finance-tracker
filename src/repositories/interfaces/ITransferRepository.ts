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
  fromAccountId?: string;
  toAccountId?: string;
  from?: Date;
  to?: Date;
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
}
