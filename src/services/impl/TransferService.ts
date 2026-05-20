import { CreateTransferSchema } from "../../dtos/transfer/CreateTransfer.dto";
import { UpdateTransferSchema } from "../../dtos/transfer/UpdateTransfer.dto";
import { transferListQuerySchema } from "../../dtos/transfer/TransferListQuery.dto";
import type { CreateTransferDto } from "../../dtos/transfer/CreateTransfer.dto";
import type { UpdateTransferDto } from "../../dtos/transfer/UpdateTransfer.dto";
import type { TransferListQueryDto } from "../../dtos/transfer/TransferListQuery.dto";
import type { TransferResponseDto } from "../../dtos/transfer/TransferResponse.dto";
import type { Transfer } from "../../generated/prisma/client";
import {
  ITransferRepository,
  type TransferFilter,
} from "../../repositories/interfaces/ITransferRepository";
import type {
  PaginatedResult,
  PaginationParams,
} from "../../repositories/interfaces/IBaseRepository";
import { DeleteResponseDto, IdDto, idDtoSchema } from "../../dtos/common";
import { toTransferResponse } from "../../mappers/transfer.mapper";
import { toDeleteResponse } from "../../mappers/delete-response.mapper";
import { parseOrThrow } from "../../utils/helpers/zodParse";
import { notFoundError } from "../../utils/errors/apiError";
import { paginateArray } from "../../utils/paginateArray";
import { ITransferService } from "../interfaces/ITransferService";
import type { ICache } from "../../redis/ICache";
import { env } from "../../config/env";
import type { ServiceContext } from "../serviceContext";
import { repoOptions, withServiceSignal } from "../serviceContext";

const TRANSFER_LIST_CACHE_PREFIX = "transfer-list";
const TRANSFER_ITEM_CACHE_PREFIX = "transfer";

interface ListCacheScope {
  accountId?: string;
}

function buildTransferListCacheKey(
  userId: string,
  query: TransferListQueryDto,
  scope: ListCacheScope = {},
): string {
  const accountId = scope.accountId ?? "";
  const fromAccountId = query.fromAccountId ?? "";
  const toAccountId = query.toAccountId ?? "";
  const from = query.from?.toISOString() ?? "";
  const to = query.to?.toISOString() ?? "";

  return [
    TRANSFER_LIST_CACHE_PREFIX,
    userId,
    accountId,
    fromAccountId,
    toAccountId,
    from,
    to,
    query.page,
    query.limit,
  ].join(":");
}

function buildTransferCacheKey(userId: string, transferId: string): string {
  return `${TRANSFER_ITEM_CACHE_PREFIX}:${userId}:${transferId}`;
}

export class TransferService implements ITransferService {
  constructor(
    private readonly transferRepository: ITransferRepository,
    private readonly cache: ICache,
  ) {}

  async createTransfer(
    transfer: CreateTransferDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<TransferResponseDto> {
    const validatedTransfer = parseOrThrow(CreateTransferSchema, transfer);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);
    const createdTransfer = await this.transferRepository.create(
      {
        ...validatedTransfer,
        userId: validatedUserId.id,
      },
      options,
    );
    await this.invalidateUserTransferCache(validatedUserId.id, undefined, ctx);
    return toTransferResponse(createdTransfer);
  }

  async updateTransfer(
    transfer: UpdateTransferDto,
    transferId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<TransferResponseDto> {
    const validatedTransfer = parseOrThrow(UpdateTransferSchema, transfer);
    const validatedTransferId = parseOrThrow(idDtoSchema, transferId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);

    await this.findOwnedTransfer(validatedTransferId.id, validatedUserId.id, ctx);

    const updatedTransfer = await this.transferRepository.update(
      validatedTransferId.id,
      validatedTransfer,
      options,
    );
    await this.invalidateUserTransferCache(validatedUserId.id, validatedTransferId.id, ctx);
    return toTransferResponse(updatedTransfer);
  }

  async deleteTransfer(
    transferId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<DeleteResponseDto> {
    const validatedTransferId = parseOrThrow(idDtoSchema, transferId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);

    await this.findOwnedTransfer(validatedTransferId.id, validatedUserId.id, ctx);

    const deletedTransfer = await this.transferRepository.softDelete(
      validatedTransferId.id,
      options,
    );
    await this.invalidateUserTransferCache(validatedUserId.id, validatedTransferId.id, ctx);
    return toDeleteResponse(deletedTransfer);
  }

  async getTransfer(
    transferId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<TransferResponseDto> {
    const validatedTransferId = parseOrThrow(idDtoSchema, transferId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const cacheKey = buildTransferCacheKey(validatedUserId.id, validatedTransferId.id);

    const cachedTransfer = await withServiceSignal(
      this.cache.getJson<TransferResponseDto>(cacheKey),
      ctx,
    );
    if (cachedTransfer) {
      return cachedTransfer;
    }

    const transfer = await this.findOwnedTransfer(validatedTransferId.id, validatedUserId.id, ctx);
    const transferResponse = toTransferResponse(transfer);
    await withServiceSignal(
      this.cache.setJson(cacheKey, transferResponse, env.TRANSFER_ITEM_CACHE_TTL_SECONDS),
      ctx,
    );
    return transferResponse;
  }

  async getTransfers(
    query: TransferListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransferResponseDto>> {
    const validatedQuery = parseOrThrow(transferListQuerySchema, query);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const cacheKey = buildTransferListCacheKey(validatedUserId.id, validatedQuery);

    const cachedTransfers = await withServiceSignal(
      this.cache.getJson<PaginatedResult<TransferResponseDto>>(cacheKey),
      ctx,
    );
    if (cachedTransfers) {
      return cachedTransfers;
    }

    const result = await this.listTransfers(
      {
        userId: validatedUserId.id,
        fromAccountId: validatedQuery.fromAccountId,
        toAccountId: validatedQuery.toAccountId,
        from: validatedQuery.from,
        to: validatedQuery.to,
      },
      { page: validatedQuery.page, limit: validatedQuery.limit },
      ctx,
    );
    await withServiceSignal(
      this.cache.setJson(cacheKey, result, env.TRANSFER_LIST_CACHE_TTL_SECONDS),
      ctx,
    );
    return result;
  }

  async getTransfersByAccountId(
    accountId: IdDto,
    query: TransferListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransferResponseDto>> {
    const validatedAccountId = parseOrThrow(idDtoSchema, accountId);
    const validatedQuery = parseOrThrow(transferListQuerySchema, query);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const cacheKey = buildTransferListCacheKey(validatedUserId.id, validatedQuery, {
      accountId: validatedAccountId.id,
    });

    const cachedTransfers = await withServiceSignal(
      this.cache.getJson<PaginatedResult<TransferResponseDto>>(cacheKey),
      ctx,
    );
    if (cachedTransfers) {
      return cachedTransfers;
    }

    const transfers = await this.transferRepository.findByAccountId(
      validatedAccountId.id,
      repoOptions(ctx),
    );
    const owned = transfers.filter((transfer) => transfer.userId === validatedUserId.id);

    const paged = paginateArray(owned, validatedQuery.page, validatedQuery.limit);
    const result = {
      ...paged,
      data: paged.data.map(toTransferResponse),
    };
    await withServiceSignal(
      this.cache.setJson(cacheKey, result, env.TRANSFER_LIST_CACHE_TTL_SECONDS),
      ctx,
    );
    return result;
  }

  async getTransfersByUserId(
    query: TransferListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransferResponseDto>> {
    return this.getTransfers(query, userId, ctx);
  }

  private async listTransfers(
    filter: TransferFilter,
    pagination: PaginationParams,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransferResponseDto>> {
    const result = await this.transferRepository.findByFilter(filter, pagination, repoOptions(ctx));
    return {
      ...result,
      data: result.data.map(toTransferResponse),
    };
  }

  private async invalidateUserTransferCache(
    userId: string,
    transferId?: string,
    ctx?: ServiceContext,
  ): Promise<void> {
    const listKeys = await withServiceSignal(
      this.cache.keys(`${TRANSFER_LIST_CACHE_PREFIX}:${userId}:*`),
      ctx,
    );
    await Promise.all(listKeys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));

    if (transferId) {
      await withServiceSignal(this.cache.delete(buildTransferCacheKey(userId, transferId)), ctx);
    }
  }

  private async findOwnedTransfer(
    transferId: string,
    userId: string,
    ctx?: ServiceContext,
  ): Promise<Transfer> {
    const transfer = await this.transferRepository.findById(transferId, repoOptions(ctx));
    if (transfer?.userId !== userId) {
      throw notFoundError("TRANSFER_NOT_FOUND");
    }
    return transfer;
  }
}
