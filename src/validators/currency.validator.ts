import { z } from 'zod';

export const CurrencyCodeParamSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Invalid ISO 4217 currency code (e.g., UAH, USD, EUR)'),
});

export const CurrencyIdParamSchema = z.object({
  id: z.string().uuid('Invalid currency ID format'),
});

export type CurrencyCodeParams = z.infer<typeof CurrencyCodeParamSchema>;
export type CurrencyIdParams = z.infer<typeof CurrencyIdParamSchema>;