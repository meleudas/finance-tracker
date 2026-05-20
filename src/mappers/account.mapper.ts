import type { Account } from "../generated/prisma/client";
import type { AccountResponseDto } from "../dtos/account/AccountResponse.dto";

type AccountWithNote = Account & { note?: string | null };

export function toAccountResponse(account: AccountWithNote): AccountResponseDto {
  return {
    id: account.id,
    userId: account.userId,
    currencyId: account.currencyId,
    name: account.name,
    note: account.note ?? null,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    isDeleted: account.isDeleted,
  };
}
