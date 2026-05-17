import type { Currency } from "../../generated/prisma/client";
import type { ICurrencyRepository } from "../interfaces/ICurrencyRepository";
import type { RequestOptions } from "../interfaces/IBaseRepository";
import { BaseRepository, type PrismaDelegate } from "./BaseRepository";
import { withAbortSignal } from "../../utils/helpers/WithAbortSignal";

export class CurrencyRepository extends BaseRepository<Currency> implements ICurrencyRepository {
  protected get delegate(): PrismaDelegate {
    return this.prisma.currency as unknown as PrismaDelegate;
  }

  async findByCode(code: string, options?: RequestOptions): Promise<Currency | null> {
    return withAbortSignal(
      this.prisma.currency.findUnique({
        where: { code },
      }),
      options?.signal,
    );
  }

  //async upsert(params: CurrencyUpsertParams, options?: RequestOptions): Promise<Currency> {
  //return withAbortSignal(this.prisma.currency.upsert(params), options?.signal);
  //}

  async findActive(options?: RequestOptions): Promise<Currency[]> {
    return withAbortSignal(
      this.prisma.currency.findMany({
        where: { isDeleted: false },
      }),
      options?.signal,
    );
  }
}
