import { prisma as globalPrisma } from "../../config/prismaClient";
import type { Currency } from "../../generated/prisma/client";
import type { ICurrencyService } from "../interfaces/ICurrencyService";
import type { RequestOptions } from "../../repositories/interfaces/IBaseRepository";
import type { Prisma } from "../../generated/prisma/client";
import { NotFoundError } from "../../utils/errors/СlientErrors";

interface CurrencyRequestOptions extends RequestOptions {
  tx?: Prisma.TransactionClient;
}

/**
 * ============================================================================
 * БІЗНЕС-ПРАВИЛА ТА ІНВАРІАНТИ ДЛЯ СУТНОСТІ "CURRENCY" (ВАЛЮТА)
 * ============================================================================
 *
 * 1. ГЛОБАЛЬНІСТЬ ТА ДОСТУПНІСТЬ (ДОВІДНИК):
 *    Валюти є загальносистемними довідковими даними. Вони не мають прив'язки до
 *    конкретного `userId`. Будь-який автентифікований користувач має право на
 *    читання повного списку підтримуваних валют.
 *
 * 2. СТАТИЧНІСТЬ MVP (ЗАБОРОНА ЗМІН КЛІЄНТАМИ):
 *    У межах поточного скоупу MVP клієнтам (web/mobile) заборонено створювати,
 *    редагувати або видаляти системні валюти через API. Довідник наповнюється
 *    виключно через міграції бази даних або демо-seed (`prisma/seed.ts`).
 *
 * 3. СУВОРЕ ВАЛІДУВАННЯ КОДІВ (ISO 4217):
 *    Пошук та перевірка валют здійснюються за трилітерними кодами (наприклад,
 *    "UAH", "USD", "EUR"). Пошук є незалежним від регістру букв (case-insensitive).
 */
export class CurrencyService implements ICurrencyService {
  async getAllCurrencies(options?: CurrencyRequestOptions): Promise<Currency[]> {
    const tx = options?.tx ?? globalPrisma;

    return tx.currency.findMany({
      where: { isDeleted: false },
      orderBy: { code: "asc" },
    });
  }

  async getCurrencyByCode(
    code: string,
    options?: CurrencyRequestOptions,
  ): Promise<Currency | null> {
    const tx = options?.tx ?? globalPrisma;
    const formattedCode = code.trim().toUpperCase();

    const currency = await tx.currency.findUnique({
      where: { code: formattedCode },
    });

    if (!currency || currency.isDeleted) {
      throw new NotFoundError(`Валюту з кодом ${formattedCode} не знайдено в системі`);
    }

    return currency;
  }

  async getCurrencyById(id: string, options?: CurrencyRequestOptions): Promise<Currency | null> {
    const tx = options?.tx ?? globalPrisma;

    const currency = await tx.currency.findUnique({
      where: { id },
    });

    if (!currency || currency.isDeleted) {
      throw new NotFoundError("Вказану валюту не знайдено");
    }

    return currency;
  }
}
