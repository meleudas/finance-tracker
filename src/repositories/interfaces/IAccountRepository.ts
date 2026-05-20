// src/repositories/interfaces/IAccountRepository.ts
import type { Account, Currency } from "../../generated/prisma/client";
import type { IBaseRepository, RequestOptions } from "./IBaseRepository";

export interface AccountWithCurrency extends Account {
  currency: Currency;
}

export interface IAccountRepository extends IBaseRepository<Account> {
  findByIdWithCurrency(
    id: string,
    userId: string, // для перевірки прав на рівні БД
    options?: RequestOptions,
  ): Promise<AccountWithCurrency | null>;
}
