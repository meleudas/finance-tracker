// src/repositories/interfaces/IAccountRepository.ts
import type { Account, Currency } from "../../generated/prisma/client";
import type {
  IBaseRepository,
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "./IBaseRepository";

export interface AccountWithCurrency extends Account {
  currency: Currency;
}

export interface AccountFilter {
  userId: string;
  currencyId?: string;
  isDeleted?: boolean;
}

export interface IAccountRepository extends IBaseRepository<Account> {
  findByIdWithCurrency(
    id: string,
    userId: string,
    options?: RequestOptions,
  ): Promise<AccountWithCurrency | null>;

  findByFilter(
    filter: AccountFilter,
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<Account>>;

  hasActiveDependencies(id: string, options?: RequestOptions): Promise<boolean>;
}
