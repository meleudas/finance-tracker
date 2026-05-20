import { CreateAccountSchema } from "../../dtos/account/CreateAccount.dto";
import { UpdateAccountSchema } from "../../dtos/account/UpdateAccount.dto";
import { accountListQuerySchema } from "../../dtos/account/AccountListQuery.dto";
import type { CreateAccountDto } from "../../dtos/account/CreateAccount.dto";
import type { UpdateAccountDto } from "../../dtos/account/UpdateAccount.dto";
import type { AccountListQueryDto } from "../../dtos/account/AccountListQuery.dto";
import type { AccountResponseDto } from "../../dtos/account/AccountResponse.dto";
import { DeleteResponseDto, IdDto, idDtoSchema } from "../../dtos/common";
import { toAccountResponse } from "../../mappers/account.mapper";
import { toDeleteResponse } from "../../mappers/delete-response.mapper";
import { parseOrThrow } from "../../utils/zodParse";
import { notFoundError } from "../../utils/apiError";
import type { IAccountRepository } from "../../repositories/interfaces/IAccountRepository";
import type { PaginatedResult } from "../../repositories/interfaces/IBaseRepository";
import type { IAccountService } from "../interfaces/IAccountService";
import type { ICache } from "../../redis";
import type { ServiceContext } from "../serviceContext";
import { repoOptions, withServiceSignal } from "../serviceContext";

const ACCOUNT_LIST_CACHE_PREFIX = "account:list";
const ACCOUNT_ITEM_CACHE_PREFIX = "account:item";

function buildAccountListCacheKey(userId: string, query: AccountListQueryDto): string {
  const currencyId = query.currencyId ?? "*";
  const includeDeleted = query.includeDeleted ? "1" : "0";
  return `${ACCOUNT_LIST_CACHE_PREFIX}:${userId}:${currencyId}:${includeDeleted}:${String(query.page)}:${String(query.limit)}`;
}

function buildAccountCacheKey(userId: string, accountId: string): string {
  return `${ACCOUNT_ITEM_CACHE_PREFIX}:${userId}:${accountId}`;
}

export class AccountService implements IAccountService {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly cache: ICache,
  ) {}

  async createAccount(
    account: CreateAccountDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<AccountResponseDto> {
    const validated = parseOrThrow(CreateAccountSchema, account);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);

    const created = await this.accountRepository.create(
      {
        userId: validatedUserId.id,
        currencyId: validated.currencyId,
        name: validated.name,
        deletedAt: null,
      },
      options,
    );

    await this.invalidateUserAccountCache(validatedUserId.id, undefined, ctx);
    return toAccountResponse(created);
  }

  async getAccount(
    accountId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<AccountResponseDto> {
    const validatedAccountId = parseOrThrow(idDtoSchema, accountId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const cacheKey = buildAccountCacheKey(validatedUserId.id, validatedAccountId.id);

    const cached = await withServiceSignal(this.cache.getJson<AccountResponseDto>(cacheKey), ctx);
    if (cached) return cached;

    const account = await this.findOwnedAccount(validatedAccountId.id, validatedUserId.id, ctx);
    const response = toAccountResponse(account);

    await withServiceSignal(this.cache.setJson(cacheKey, response, 600), ctx);
    return response;
  }

  async getAccounts(
    query: AccountListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<AccountResponseDto>> {
    const validatedQuery = parseOrThrow(accountListQuerySchema, query);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const cacheKey = buildAccountListCacheKey(validatedUserId.id, validatedQuery);

    const cached = await withServiceSignal(
      this.cache.getJson<PaginatedResult<AccountResponseDto>>(cacheKey),
      ctx,
    );
    if (cached) return cached;

    const result = await this.accountRepository.findByFilter(
      {
        userId: validatedUserId.id,
        currencyId: validatedQuery.currencyId,
        isDeleted: validatedQuery.includeDeleted,
      },
      { page: validatedQuery.page, limit: validatedQuery.limit },
      repoOptions(ctx),
    );

    const mappedResult: PaginatedResult<AccountResponseDto> = {
      ...result,
      data: result.data.map(toAccountResponse),
    };

    await withServiceSignal(this.cache.setJson(cacheKey, mappedResult, 300), ctx);
    return mappedResult;
  }

  async updateAccount(
    account: UpdateAccountDto,
    accountId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<AccountResponseDto> {
    const validated = parseOrThrow(UpdateAccountSchema, account);
    const validatedAccountId = parseOrThrow(idDtoSchema, accountId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);

    await this.findOwnedAccount(validatedAccountId.id, validatedUserId.id, ctx);

    const updated = await this.accountRepository.update(
      validatedAccountId.id,
      {
        ...(validated.name && { name: validated.name }),
      },
      options,
    );

    await this.invalidateUserAccountCache(validatedUserId.id, validatedAccountId.id, ctx);
    return toAccountResponse(updated);
  }

  async deleteAccount(
    accountId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<DeleteResponseDto> {
    const validatedAccountId = parseOrThrow(idDtoSchema, accountId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);

    await this.findOwnedAccount(validatedAccountId.id, validatedUserId.id, ctx);

    const deleted = await this.accountRepository.softDelete(validatedAccountId.id, options);

    await this.invalidateUserAccountCache(validatedUserId.id, validatedAccountId.id, ctx);
    return toDeleteResponse(deleted);
  }

  private async findOwnedAccount(accountId: string, userId: string, ctx?: ServiceContext) {
    const account = await this.accountRepository.findById(accountId, repoOptions(ctx));
    if (account?.userId !== userId || account.isDeleted) {
      throw notFoundError("ACCOUNT_NOT_FOUND");
    }
    return account;
  }

  private async invalidateUserAccountCache(
    userId: string,
    accountId?: string,
    ctx?: ServiceContext,
  ): Promise<void> {
    const listKeys = await withServiceSignal(
      this.cache.keys(`${ACCOUNT_LIST_CACHE_PREFIX}:${userId}:*`),
      ctx,
    );
    await Promise.all(listKeys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));

    if (accountId) {
      await withServiceSignal(this.cache.delete(buildAccountCacheKey(userId, accountId)), ctx);
    }
  }
}
