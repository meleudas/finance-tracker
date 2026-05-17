import { Budget, Prisma } from "../../generated/prisma/client";
import { IBaseRepository, RequestOptions } from "./IBaseRepository";

export interface BudgetUpsertParams {
  where: Prisma.BudgetWhereUniqueInput;
  create: {
    id?: string;
    userId: string;
    accountId: string;
    currencyId: string;
    categoryId?: string;
    name: string;
    periodStart: Date;
    periodEnd: Date;
    limitAmount: Prisma.Decimal | number;
  };
  update: {
    accountId?: string;
    currencyId?: string;
    categoryId?: string | null;
    name?: string;
    periodStart?: Date;
    periodEnd?: Date;
    limitAmount?: Prisma.Decimal | number;
    isDeleted?: boolean;
    deletedAt?: Date | null;
  };
}

export interface IBudgetRepository extends IBaseRepository<Budget> {
  findByUserId(userId: string, options?: RequestOptions): Promise<Budget[]>;
  findActiveByPeriod(userId: string, date: Date, options?: RequestOptions): Promise<Budget[]>;
  //upsert(params: BudgetUpsertParams, options?: RequestOptions): Promise<Budget>;
}
