import type { Account } from "../generated/prisma/client";
import type { AccountResponseDto } from "../dtos/account/AccountResponse.dto";

export function toAccountResponse(account: Account): AccountResponseDto {
  return {
    id: account.id,
    userId: account.userId,
    currencyId: account.currencyId,
    name: account.name,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    isDeleted: account.isDeleted,
  };
}
