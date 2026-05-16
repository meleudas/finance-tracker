import type { Currency, Prisma } from "../../generated/prisma/client";
import type { IBaseRepository, RequestOptions } from "./IBaseRepository";

export interface CurrencyUpsertParams {
  where: Prisma.CurrencyWhereUniqueInput;
  create: {
    id?: string;
    code: string;
    name: string;
    minorUnits?: number;
  };
  update: {
    code?: string;
    name?: string;
    minorUnits?: number;
    isDeleted?: boolean;
    deletedAt?: Date | null;
  };
}

export interface ICurrencyRepository extends IBaseRepository<Currency> {
  findByCode(code: string, options?: RequestOptions): Promise<Currency | null>;
  upsert(params: CurrencyUpsertParams, options?: RequestOptions): Promise<Currency>;
}
