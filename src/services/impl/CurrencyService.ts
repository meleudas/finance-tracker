// src/services/impl/CurrencyService.ts
import type { Currency } from "../../generated/prisma/client";
import type { ICurrencyService } from "../interfaces/ICurrencyService";
import type { ICurrencyRepository } from "../../repositories/interfaces/ICurrencyRepository";
import type { RequestOptions } from "../../repositories/interfaces/IBaseRepository";
import { NotFoundError } from "../../utils/errors/СlientErrors";
import { withAbortSignal } from "../../utils/helpers/WithAbortSignal";

export class CurrencyService implements ICurrencyService {
  constructor(private readonly currencyRepo: ICurrencyRepository) {}

  async getAllCurrencies(options?: RequestOptions): Promise<Currency[]> {
    return withAbortSignal(
      this.currencyRepo.findActive(options),
      options?.signal
    );
  }

  async getCurrencyByCode(code: string, options?: RequestOptions): Promise<Currency> {
    const formattedCode = code.trim().toUpperCase();

    const currency = await withAbortSignal(
      this.currencyRepo.findByCode(formattedCode, options),
      options?.signal
    );

    return this.#ensureActiveEntity(currency, `Валюту з кодом ${formattedCode} не знайдено в системі`);
  }

  async getCurrencyById(id: string, options?: RequestOptions): Promise<Currency> {
    const currency = await withAbortSignal(
      this.currencyRepo.findById(id, options),
      options?.signal
    );

    return this.#ensureActiveEntity(currency, "Вказану валюту не знайдено");
  }

  #ensureActiveEntity(entity: Currency | null, errorMessage: string): Currency {
    if (!entity || entity.isDeleted) {
      throw new NotFoundError(errorMessage);
    }
    return entity;
  }
}