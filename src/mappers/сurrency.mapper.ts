// src/mappers/currency.mapper.ts
import type { Currency } from "../generated/prisma/client";
import {
  CurrencyResponseSchema,
  type CurrencyResponseDto,
} from "../dtos/currency/CurrencyResponse.dto";
import {
  CurrencyListResponseSchema,
  type CurrencyListResponseDto,
} from "../dtos/currency/CurrencyListResponse.dto";
import { toIsoString } from "./prisma-format.utils";

function toCurrencyFields(currency: Currency) {
  return {
    id: currency.id,
    code: currency.code,
    name: currency.name,
    minorUnits: currency.minorUnits,
    createdAt: toIsoString(currency.createdAt),
    updatedAt: toIsoString(currency.updatedAt),
    deletedAt: currency.deletedAt ? toIsoString(currency.deletedAt) : null,
    isDeleted: currency.isDeleted,
  };
}

/**
 * Мапить одну сутність Currency з Prisma у CurrencyResponseDto
 */
export function toCurrencyResponse(currency: Currency): CurrencyResponseDto {
  return CurrencyResponseSchema.parse(toCurrencyFields(currency));
}

/**
 * Мапить масив сутностей Currency у список відповідей
 */
export function toCurrencyResponseList(currencies: Currency[]): CurrencyResponseDto[] {
  return currencies.map((currency) => toCurrencyResponse(currency));
}

/**
 * Мапить результат запиту з пагінацією у CurrencyListResponseDto
 * @param currencies - масив сутностей Currency з Prisma
 * @param page - поточна сторінка
 * @param limit - ліміт на сторінку
 * @param total - загальна кількість записів
 */
export function toCurrencyListResponse(
  currencies: Currency[],
  page: number,
  limit: number,
  total: number,
): CurrencyListResponseDto {
  return CurrencyListResponseSchema.parse({
    data: toCurrencyResponseList(currencies),
    meta: {
      page,
      limit,
      total,
      hasNextPage: page * limit < total,
    },
  });
}