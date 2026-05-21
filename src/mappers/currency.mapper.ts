import type { Currency } from "../generated/prisma/client";
import {
  PublicCurrencyResponseSchema,
  type PublicCurrencyResponseDto,
} from "../dtos/currency/CurrencyResponse.dto";
import { toIsoString } from "./prisma-format.utils";

function toPublicCurrencyFields(currency: Currency) {
  return {
    id: currency.id,
    code: currency.code,
    name: currency.name,
    minorUnits: currency.minorUnits,
    createdAt: toIsoString(currency.createdAt),
    updatedAt: toIsoString(currency.updatedAt),
  };
}

export function toCurrencyResponse(currency: Currency): PublicCurrencyResponseDto {
  return PublicCurrencyResponseSchema.parse(toPublicCurrencyFields(currency));
}

export function toCurrencyResponseList(currencies: Currency[]): PublicCurrencyResponseDto[] {
  return currencies.map((currency) => toCurrencyResponse(currency));
}
