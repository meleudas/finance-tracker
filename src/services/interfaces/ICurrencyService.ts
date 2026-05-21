import type { Currency } from "../../generated/prisma/client";
import type { ServiceContext } from "../serviceContext";

export interface ICurrencyService {
  getAllCurrencies(ctx?: ServiceContext): Promise<Currency[]>;
  getCurrencyByCode(code: string, ctx?: ServiceContext): Promise<Currency>;
  getCurrencyById(id: string, ctx?: ServiceContext): Promise<Currency>;
}
