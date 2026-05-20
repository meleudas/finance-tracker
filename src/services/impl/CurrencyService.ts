import type { Currency } from "../../generated/prisma/client";
import type { ICurrencyService } from "../interfaces/ICurrencyService";
import type { ICurrencyRepository } from "../../repositories/interfaces/ICurrencyRepository";
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

  async getAllCurrencies(ctx?: ServiceContext): Promise<Currency[]> {
    const options = repoOptions(ctx);

    const cached = await withServiceSignal(
      this.cache.getJson<Currency[]>(CURRENCY_LIST_CACHE_KEY),
      ctx,
    );
    if (cached) {
      return cached;
    }

    const currencies = await this.currencyRepo.findActive(options);

    await withServiceSignal(
      this.cache.setJson(CURRENCY_LIST_CACHE_KEY, currencies, env.CURRENCY_LIST_CACHE_TTL_SECONDS),
      ctx,
    );
    return currencies;
  }

  async getCurrencyByCode(code: string, ctx?: ServiceContext): Promise<Currency> {
    const formattedCode = code.trim().toUpperCase();
    const options = repoOptions(ctx);
    const cacheKey = buildCurrencyCodeCacheKey(formattedCode);

    const cached = await withServiceSignal(this.cache.getJson<Currency>(cacheKey), ctx);
    if (cached) {
      return this.#ensureActiveEntity(cached, `Currency with code ${formattedCode} not found`);
    }

    const currency = await this.currencyRepo.findByCode(formattedCode, options);

    const active = this.#ensureActiveEntity(
      currency,
      `Currency with code ${formattedCode} not found`,
    );

    await withServiceSignal(
      this.cache.setJson(cacheKey, active, env.CURRENCY_ITEM_CACHE_TTL_SECONDS),
      ctx,
    );
    return active;
  }

  async getCurrencyById(id: string, ctx?: ServiceContext): Promise<Currency> {
    const options = repoOptions(ctx);
    const cacheKey = buildCurrencyIdCacheKey(id);

    const cached = await withServiceSignal(this.cache.getJson<Currency>(cacheKey), ctx);
    if (cached) {
      return this.#ensureActiveEntity(cached, "Currency not found");
    }

    const currency = await this.currencyRepo.findById(id, options);

    const active = this.#ensureActiveEntity(currency, "Currency not found");

    await withServiceSignal(
      this.cache.setJson(cacheKey, active, env.CURRENCY_ITEM_CACHE_TTL_SECONDS),
      ctx,
    );
    return active;
  }

  #ensureActiveEntity(entity: Currency | null, errorMessage: string): Currency {
    if (!entity || entity.isDeleted) {
      throw new NotFoundError(errorMessage);
    }
    return entity;
  }
}
