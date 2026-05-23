import type { Currency } from "../../generated/prisma/client";
import type { PublicCurrencyResponseDto } from "../../dtos/currency/CurrencyResponse.dto";
import type { ICurrencyService } from "../interfaces/ICurrencyService";
import type { ICurrencyRepository } from "../../repositories/interfaces/ICurrencyRepository";
import { toCurrencyResponse, toCurrencyResponseList } from "../../mappers/currency.mapper";
import { NotFoundError } from "../../utils/errors/ClientErrors";
import type { ICache } from "../../redis";
import { env } from "../../config/env";
import type { ServiceContext } from "../serviceContext";
import { repoOptions, withServiceSignal } from "../serviceContext";

const CURRENCY_LIST_CACHE_KEY = "currency:list";
const CURRENCY_CODE_CACHE_PREFIX = "currency:code";
const CURRENCY_ID_CACHE_PREFIX = "currency:id";

function buildCurrencyCodeCacheKey(code: string): string {
  return `${CURRENCY_CODE_CACHE_PREFIX}:${code}`;
}

function buildCurrencyIdCacheKey(id: string): string {
  return `${CURRENCY_ID_CACHE_PREFIX}:${id}`;
}

export class CurrencyService implements ICurrencyService {
  constructor(
    private readonly currencyRepo: ICurrencyRepository,
    private readonly cache: ICache,
  ) {}

  async getAllCurrencies(ctx?: ServiceContext): Promise<PublicCurrencyResponseDto[]> {
    const options = repoOptions(ctx);

    const cached = await withServiceSignal(
      this.cache.getJson<PublicCurrencyResponseDto[]>(CURRENCY_LIST_CACHE_KEY),
      ctx,
    );
    if (cached) {
      return cached;
    }

    const currencies = await this.currencyRepo.findActive(options);
    const mapped = toCurrencyResponseList(currencies);

    await withServiceSignal(
      this.cache.setJson(CURRENCY_LIST_CACHE_KEY, mapped, env.CURRENCY_LIST_CACHE_TTL_SECONDS),
      ctx,
    );
    return mapped;
  }

  async getCurrencyByCode(code: string, ctx?: ServiceContext): Promise<PublicCurrencyResponseDto> {
    const formattedCode = code.trim().toUpperCase();
    const options = repoOptions(ctx);
    const cacheKey = buildCurrencyCodeCacheKey(formattedCode);

    const cached = await withServiceSignal(
      this.cache.getJson<PublicCurrencyResponseDto>(cacheKey),
      ctx,
    );
    if (cached) {
      return cached;
    }

    const currency = await this.currencyRepo.findByCode(formattedCode, options);
    const active = this.#ensureActiveEntity(
      currency,
      `Currency with code ${formattedCode} not found`,
    );
    const mapped = toCurrencyResponse(active);

    await withServiceSignal(
      this.cache.setJson(cacheKey, mapped, env.CURRENCY_ITEM_CACHE_TTL_SECONDS),
      ctx,
    );
    return mapped;
  }

  async getCurrencyById(id: string, ctx?: ServiceContext): Promise<PublicCurrencyResponseDto> {
    const options = repoOptions(ctx);
    const cacheKey = buildCurrencyIdCacheKey(id);

    const cached = await withServiceSignal(
      this.cache.getJson<PublicCurrencyResponseDto>(cacheKey),
      ctx,
    );
    if (cached) {
      return cached;
    }

    const currency = await this.currencyRepo.findById(id, options);
    const active = this.#ensureActiveEntity(currency, "Currency not found");
    const mapped = toCurrencyResponse(active);

    await withServiceSignal(
      this.cache.setJson(cacheKey, mapped, env.CURRENCY_ITEM_CACHE_TTL_SECONDS),
      ctx,
    );
    return mapped;
  }

  #ensureActiveEntity(entity: Currency | null, errorMessage: string): Currency {
    if (!entity || entity.isDeleted) {
      throw new NotFoundError(errorMessage);
    }
    return entity;
  }
}
