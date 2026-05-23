import type { PublicCurrencyResponseDto } from "../../dtos/currency/CurrencyResponse.dto";
import type { ServiceContext } from "../serviceContext";

export interface ICurrencyService {
  getAllCurrencies(ctx?: ServiceContext): Promise<PublicCurrencyResponseDto[]>;
  getCurrencyByCode(code: string, ctx?: ServiceContext): Promise<PublicCurrencyResponseDto>;
  getCurrencyById(id: string, ctx?: ServiceContext): Promise<PublicCurrencyResponseDto>;
}
