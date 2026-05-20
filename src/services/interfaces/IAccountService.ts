import type { CreateAccountDto } from "../../dtos/account/CreateAccount.dto";
import type { UpdateAccountDto } from "../../dtos/account/UpdateAccount.dto";
import type { AccountResponseDto } from "../../dtos/account/AccountResponse.dto";
import type { AccountListQueryDto } from "../../dtos/account/AccountListQuery.dto";
import type { DeleteResponseDto, IdDto } from "../../dtos/common";
import type { PaginatedResult } from "../../repositories/interfaces/IBaseRepository";
import type { ServiceContext } from "../serviceContext";

export interface IAccountService {
  createAccount(
    account: CreateAccountDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<AccountResponseDto>;
  updateAccount(
    account: UpdateAccountDto,
    accountId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<AccountResponseDto>;
  deleteAccount(accountId: IdDto, userId: IdDto, ctx?: ServiceContext): Promise<DeleteResponseDto>;
  getAccount(accountId: IdDto, userId: IdDto, ctx?: ServiceContext): Promise<AccountResponseDto>;
  getAccounts(
    query: AccountListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<AccountResponseDto>>;
}
