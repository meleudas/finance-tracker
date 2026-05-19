import type { Transaction } from "../generated/prisma/client";
import {
  TransactionResponseSchema,
  type TransactionResponseDto,
} from "../dtos/transaction/TransactionResponse.dto";
import { decimalToNumber, toIsoString } from "./prisma-format.utils";

export { toDeleteResponse } from "./delete-response.mapper";

export function toTransactionResponse(transaction: Transaction): TransactionResponseDto {
  return TransactionResponseSchema.parse({
    id: transaction.id,
    accountId: transaction.accountId,
    currencyId: transaction.currencyId,
    categoryId: transaction.categoryId,
    amount: decimalToNumber(transaction.amount),
    direction: transaction.direction,
    occurredAt: toIsoString(transaction.occurredAt),
    note: transaction.note ?? undefined,
    createdAt: toIsoString(transaction.createdAt),
    updatedAt: toIsoString(transaction.updatedAt),
    deletedAt: transaction.deletedAt ? toIsoString(transaction.deletedAt) : null,
    isDeleted: transaction.isDeleted,
  });
}
