import type { Currency } from "../../generated/prisma/client";
import type { RequestOptions } from "../../repositories/interfaces/IBaseRepository";

export interface ICurrencyService {
  getAllCurrencies(options?: RequestOptions): Promise<Currency[]>;
  getCurrencyByCode(code: string, options?: RequestOptions): Promise<Currency | null>;
  getCurrencyById(id: string, options?: RequestOptions): Promise<Currency | null>;
}
