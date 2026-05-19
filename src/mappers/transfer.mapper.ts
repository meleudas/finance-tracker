import type { Transfer } from "../generated/prisma/client";
import {
  TransferResponseSchema,
  type TransferResponseDto,
} from "../dtos/transfer/TransferResponse.dto";
import { decimalToNumber, toIsoString } from "./prisma-format.utils";

export function toTransferResponse(transfer: Transfer): TransferResponseDto {
  return TransferResponseSchema.parse({
    id: transfer.id,
    fromAccountId: transfer.fromAccountId,
    toAccountId: transfer.toAccountId,
    currencyId: transfer.currencyId,
    amount: decimalToNumber(transfer.amount),
    occurredAt: toIsoString(transfer.occurredAt),
    note: transfer.note ?? undefined,
    createdAt: toIsoString(transfer.createdAt),
    updatedAt: toIsoString(transfer.updatedAt),
    deletedAt: transfer.deletedAt ? toIsoString(transfer.deletedAt) : null,
    isDeleted: transfer.isDeleted,
  });
}
