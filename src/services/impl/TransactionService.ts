import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionResponseDto,
  transactionListQuerySchema,
} from "../../dtos/transaction";
import { CreateTransactionSchema } from "../../dtos/transaction/CreateTransaction.dto";
import { UpdateTransactionSchema } from "../../dtos/transaction/UpdateTransaction.dto";
import type { Transaction, TransactionDirection } from "../../generated/prisma/client";
import {
  ITransactionRepository,
  type TransactionFilter,
} from "../../repositories/interfaces/ITransactionRepository";
import type { IAccountRepository } from "../../repositories/interfaces/IAccountRepository";
import type { ICategoryRepository } from "../../repositories/interfaces/ICategoryRepository";
import type { IAttachmentRepository } from "../../repositories/interfaces/IAttachmentRepository";
import type {
  PaginatedResult,
  PaginationParams,
} from "../../repositories/interfaces/IBaseRepository";
import { IdDto, idDtoSchema } from "../../dtos/common";
import { TransactionListQueryDto } from "../../dtos/transaction/TransactionListQuery.dto";
import { DeleteResponseDto } from "../../dtos/common/DeleteResponse.dto";
import { toDeleteResponse } from "../../mappers/delete-response.mapper";
import { toTransactionResponse } from "../../mappers/transaction.mapper";
import { parseOrThrow } from "../../utils/helpers/zodParse";
import { ConflictError, NotFoundError, ValidationError } from "../../utils/errors/ClientErrors";
import { ITransactionService } from "../interfaces/ITransactionService";
import type { ICache } from "../../redis/ICache";
import { env } from "../../config/env";
import type { ServiceContext } from "../serviceContext";
import { repoOptions, withServiceSignal } from "../serviceContext";

const TRANSACTION_LIST_CACHE_PREFIX = "transaction-list";
const TRANSACTION_ITEM_CACHE_PREFIX = "transaction";
const BUDGET_LIST_CACHE_PREFIX = "budget:list";
const BUDGET_ITEM_CACHE_PREFIX = "budget:item";
const BUDGET_PROGRESS_CACHE_PREFIX = "budget:progress";

interface ListCacheScope {
  accountId?: string;
  categoryId?: string;
}

interface TransactionRefs {
  accountId: string;
  currencyId: string;
  categoryId?: string | null;
  direction: TransactionDirection;
}

function buildTransactionListCacheKey(
  userId: string,
  query: TransactionListQueryDto,
  scope: ListCacheScope = {},
): string {
  const accountId = scope.accountId ?? query.accountId ?? "";
  const categoryId = scope.categoryId ?? query.categoryId ?? "";
  const from = query.from?.toISOString() ?? "";
  const to = query.to?.toISOString() ?? "";
  const direction = query.direction ?? "";

  return [
    TRANSACTION_LIST_CACHE_PREFIX,
    userId,
    accountId,
    categoryId,
    direction,
    from,
    to,
    query.page,
    query.limit,
  ].join(":");
}

function buildTransactionCacheKey(userId: string, transactionId: string): string {
  return `${TRANSACTION_ITEM_CACHE_PREFIX}:${userId}:${transactionId}`;
}

export class TransactionService implements ITransactionService {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly attachmentRepository: IAttachmentRepository,
    private readonly cache: ICache,
  ) {}

  async createTransaction(
    transaction: CreateTransactionDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<TransactionResponseDto> {
    const validatedTransaction = parseOrThrow(CreateTransactionSchema, transaction);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);

    await this.validateTransactionRefs(
      validatedUserId.id,
      {
        accountId: validatedTransaction.accountId,
        currencyId: validatedTransaction.currencyId,
        categoryId: validatedTransaction.categoryId ?? null,
        direction: validatedTransaction.direction,
      },
      ctx,
    );

    const createdTransaction = await this.transactionRepository.create(
      {
        ...validatedTransaction,
        userId: validatedUserId.id,
      },
      options,
    );
    await this.invalidateUserTransactionCache(validatedUserId.id, undefined, ctx);
    await this.invalidateUserBudgetCache(validatedUserId.id, ctx);
    return toTransactionResponse(createdTransaction);
  }

  async updateTransaction(
    transaction: UpdateTransactionDto,
    transactionId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<TransactionResponseDto> {
    const validatedTransaction = parseOrThrow(UpdateTransactionSchema, transaction);
    const validatedTransactionId = parseOrThrow(idDtoSchema, transactionId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);

    const existing = await this.findOwnedTransaction(
      validatedTransactionId.id,
      validatedUserId.id,
      ctx,
    );

    const effective: TransactionRefs = {
      accountId: validatedTransaction.accountId ?? existing.accountId,
      currencyId: validatedTransaction.currencyId ?? existing.currencyId,
      categoryId:
        validatedTransaction.categoryId !== undefined
          ? validatedTransaction.categoryId
          : existing.categoryId,
      direction: validatedTransaction.direction ?? existing.direction,
    };

    await this.validateTransactionRefs(validatedUserId.id, effective, ctx);

    const updatedTransaction = await this.transactionRepository.update(
      validatedTransactionId.id,
      validatedTransaction,
      options,
    );
    await this.invalidateUserTransactionCache(validatedUserId.id, validatedTransactionId.id, ctx);
    await this.invalidateUserBudgetCache(validatedUserId.id, ctx);
    return toTransactionResponse(updatedTransaction);
  }

  async deleteTransaction(
    transactionId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<DeleteResponseDto> {
    const validatedTransactionId = parseOrThrow(idDtoSchema, transactionId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);

    await this.findOwnedTransaction(validatedTransactionId.id, validatedUserId.id, ctx);

    const attachments = await this.attachmentRepository.findByTransactionId(
      validatedTransactionId.id,
      options,
    );
    if (attachments.length > 0) {
      throw new ConflictError("Transaction has attachments");
    }

    const deletedTransaction = await this.transactionRepository.softDelete(
      validatedTransactionId.id,
      options,
    );
    await this.invalidateUserTransactionCache(validatedUserId.id, validatedTransactionId.id, ctx);
    await this.invalidateUserBudgetCache(validatedUserId.id, ctx);
    return toDeleteResponse(deletedTransaction);
  }

  async getTransaction(
    transactionId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<TransactionResponseDto> {
    const validatedTransactionId = parseOrThrow(idDtoSchema, transactionId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const cacheKey = buildTransactionCacheKey(validatedUserId.id, validatedTransactionId.id);

    const cachedTransaction = await withServiceSignal(
      this.cache.getJson<TransactionResponseDto>(cacheKey),
      ctx,
    );
    if (cachedTransaction) {
      return cachedTransaction;
    }

    const transaction = await this.findOwnedTransaction(
      validatedTransactionId.id,
      validatedUserId.id,
      ctx,
    );
    const transactionResponse = toTransactionResponse(transaction);
    await withServiceSignal(
      this.cache.setJson(cacheKey, transactionResponse, env.TRANSACTION_ITEM_CACHE_TTL_SECONDS),
      ctx,
    );
    return transactionResponse;
  }

  async getTransactions(
    query: TransactionListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransactionResponseDto>> {
    const validatedQuery = parseOrThrow(transactionListQuerySchema, query);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const cacheKey = buildTransactionListCacheKey(validatedUserId.id, validatedQuery);

    const cachedTransactions = await withServiceSignal(
      this.cache.getJson<PaginatedResult<TransactionResponseDto>>(cacheKey),
      ctx,
    );
    if (cachedTransactions) {
      return cachedTransactions;
    }

    const result = await this.listTransactions(
      {
        userId: validatedUserId.id,
        accountId: validatedQuery.accountId,
        categoryId: validatedQuery.categoryId,
        direction: validatedQuery.direction,
        from: validatedQuery.from,
        to: validatedQuery.to,
      },
      { page: validatedQuery.page, limit: validatedQuery.limit },
      ctx,
    );
    await withServiceSignal(
      this.cache.setJson(cacheKey, result, env.TRANSACTION_LIST_CACHE_TTL_SECONDS),
      ctx,
    );
    return result;
  }

  async getTransactionsByAccountId(
    accountId: IdDto,
    query: TransactionListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransactionResponseDto>> {
    const validatedAccountId = parseOrThrow(idDtoSchema, accountId);
    const validatedQuery = parseOrThrow(transactionListQuerySchema, query);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const cacheKey = buildTransactionListCacheKey(validatedUserId.id, validatedQuery, {
      accountId: validatedAccountId.id,
    });

    const cachedTransactions = await withServiceSignal(
      this.cache.getJson<PaginatedResult<TransactionResponseDto>>(cacheKey),
      ctx,
    );
    if (cachedTransactions) {
      return cachedTransactions;
    }

    const result = await this.listTransactions(
      {
        userId: validatedUserId.id,
        accountId: validatedAccountId.id,
        direction: validatedQuery.direction,
        from: validatedQuery.from,
        to: validatedQuery.to,
      },
      { page: validatedQuery.page, limit: validatedQuery.limit },
      ctx,
    );
    await withServiceSignal(
      this.cache.setJson(cacheKey, result, env.TRANSACTION_LIST_CACHE_TTL_SECONDS),
      ctx,
    );
    return result;
  }

  async getTransactionsByCategoryId(
    categoryId: IdDto,
    query: TransactionListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransactionResponseDto>> {
    const validatedCategoryId = parseOrThrow(idDtoSchema, categoryId);
    const validatedQuery = parseOrThrow(transactionListQuerySchema, query);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const cacheKey = buildTransactionListCacheKey(validatedUserId.id, validatedQuery, {
      categoryId: validatedCategoryId.id,
    });

    const cachedTransactions = await withServiceSignal(
      this.cache.getJson<PaginatedResult<TransactionResponseDto>>(cacheKey),
      ctx,
    );
    if (cachedTransactions) {
      return cachedTransactions;
    }

    const result = await this.listTransactions(
      {
        userId: validatedUserId.id,
        categoryId: validatedCategoryId.id,
        direction: validatedQuery.direction,
        from: validatedQuery.from,
        to: validatedQuery.to,
      },
      { page: validatedQuery.page, limit: validatedQuery.limit },
      ctx,
    );
    await withServiceSignal(
      this.cache.setJson(cacheKey, result, env.TRANSACTION_LIST_CACHE_TTL_SECONDS),
      ctx,
    );
    return result;
  }

  async getTransactionsByUserId(
    query: TransactionListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransactionResponseDto>> {
    return this.getTransactions(query, userId, ctx);
  }

  private async listTransactions(
    filter: TransactionFilter,
    pagination: PaginationParams,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransactionResponseDto>> {
    const result = await this.transactionRepository.findByFilter(
      filter,
      pagination,
      repoOptions(ctx),
    );
    return {
      ...result,
      data: result.data.map(toTransactionResponse),
    };
  }

  private async validateTransactionRefs(
    userId: string,
    refs: TransactionRefs,
    ctx?: ServiceContext,
  ): Promise<void> {
    const options = repoOptions(ctx);

    const account = await this.accountRepository.findByIdWithCurrency(
      refs.accountId,
      userId,
      options,
    );
    if (!account) {
      throw new NotFoundError("Account");
    }

    if (account.currencyId !== refs.currencyId) {
      throw new ValidationError("Transaction currency must match the account currency");
    }

    if (refs.categoryId) {
      const category = await this.categoryRepository.findById(refs.categoryId, options);
      if (!category || category.isDeleted || category.userId !== userId) {
        throw new NotFoundError("Category");
      }
      if (category.kind !== refs.direction) {
        throw new ValidationError("Category kind must match transaction direction");
      }
    }
  }

  private async invalidateUserBudgetCache(userId: string, ctx?: ServiceContext): Promise<void> {
    const prefixes = [
      `${BUDGET_LIST_CACHE_PREFIX}:${userId}:`,
      `${BUDGET_ITEM_CACHE_PREFIX}:${userId}:`,
      `${BUDGET_PROGRESS_CACHE_PREFIX}:${userId}:`,
    ];

    for (const prefix of prefixes) {
      const keys = await withServiceSignal(this.cache.keys(`${prefix}*`), ctx);
      await Promise.all(keys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));
    }
  }

  private async invalidateUserTransactionCache(
    userId: string,
    transactionId?: string,
    ctx?: ServiceContext,
  ): Promise<void> {
    const listKeys = await withServiceSignal(
      this.cache.keys(`${TRANSACTION_LIST_CACHE_PREFIX}:${userId}:*`),
      ctx,
    );
    await Promise.all(listKeys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));

    if (transactionId) {
      await withServiceSignal(
        this.cache.delete(buildTransactionCacheKey(userId, transactionId)),
        ctx,
      );
    }
  }

  private async findOwnedTransaction(
    transactionId: string,
    userId: string,
    ctx?: ServiceContext,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(transactionId, repoOptions(ctx));
    if (transaction?.userId !== userId) {
      throw new NotFoundError("Transaction");
    }
    return transaction;
  }
}
