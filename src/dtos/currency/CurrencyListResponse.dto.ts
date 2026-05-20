// src/validators/currency/currency.list.response.schema.ts
import { z } from "zod";
import { CurrencyResponseSchema } from "./CurrencyResponse.dto";
import { paginationQuerySchema } from "../common/pagination.dto";

export const CurrencyListResponseSchema = z
  .object({
    data: z.array(CurrencyResponseSchema),
    meta: z.object({
      page: paginationQuerySchema.shape.page,
      limit: paginationQuerySchema.shape.limit,
      total: z.number().int().nonnegative(),
      hasNextPage: z.boolean(),
    }),
  })
  .strict();

export type CurrencyListResponseDto = z.infer<typeof CurrencyListResponseSchema>;