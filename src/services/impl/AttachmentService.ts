import type { Attachment } from "../../generated/prisma/client";
import { IAttachmentRepository } from "../../repositories/interfaces/IAttachmentRepository";
import { ITransactionRepository } from "../../repositories/interfaces/ITransactionRepository";
import {
  AttachmentIdParamDto,
  attachmentIdParamSchema,
  DeleteResponseDto,
  IdDto,
  idDtoSchema,
  TransactionIdParamDto,
  transactionIdParamSchema,
} from "../../dtos/common";
import {
  attachmentDownloadUrlQuerySchema,
  AttachmentDownloadUrlQueryDto,
  AttachmentDownloadUrlResponseDto,
  attachmentDownloadUrlResponseSchema,
  AttachmentResponseDto,
  AttachmentWithDownloadUrlResponseDto,
  MAX_ATTACHMENT_SIZE_BYTES,
  presignedUploadUrlRequestSchema,
  PresignedUploadUrlRequestDto,
  PresignedUploadUrlResponseDto,
  presignedUploadUrlResponseSchema,
  UpdateAttachmentDto,
  UpdateAttachmentSchema,
  UploadAttachmentInput,
  uploadAttachmentSchema,
} from "../../dtos/attachment";
import { env } from "../../config/env";
import { toAttachmentResponse, toAttachmentWithDownloadUrl } from "../../mappers/attachment.mapper";
import { toDeleteResponse } from "../../mappers/delete-response.mapper";
import { parseOrThrow } from "../../utils/zodParse";
import { notFoundError, validationError } from "../../utils/apiError";
import type { IFileStorage } from "../../storage/IFileStorage";
import { FileStorage } from "../../storage/FileStorage";
import { IAttachmentService } from "../interfaces/IAttachmentService";
import type { ICache } from "../../redis/ICache";
import type { ServiceContext } from "../serviceContext";
import { repoOptions, withServiceSignal } from "../serviceContext";

const ATTACHMENT_LIST_CACHE_PREFIX = "attachment-list";
const ATTACHMENT_DOWNLOAD_CACHE_PREFIX = "attachment-download";

function buildAttachmentListCacheKey(
  userId: string,
  transactionId: string,
  expiresInSeconds: number,
): string {
  return [ATTACHMENT_LIST_CACHE_PREFIX, userId, transactionId, expiresInSeconds].join(":");
}

function buildAttachmentDownloadCacheKey(
  userId: string,
  transactionId: string,
  attachmentId: string,
  expiresInSeconds: number,
): string {
  return [
    ATTACHMENT_DOWNLOAD_CACHE_PREFIX,
    userId,
    transactionId,
    attachmentId,
    expiresInSeconds,
  ].join(":");
}

export class AttachmentService implements IAttachmentService {
  constructor(
    private readonly attachmentRepository: IAttachmentRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly fileStorage: IFileStorage,
    private readonly cache: ICache,
  ) {}

  async uploadAttachment(
    input: UploadAttachmentInput,
    transactionId: TransactionIdParamDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentResponseDto> {
    const validatedInput = this.validateUploadInput(input);
    const validatedTransactionId = parseOrThrow(transactionIdParamSchema, transactionId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);

    await this.findOwnedTransaction(validatedTransactionId.transactionId, validatedUserId.id, ctx);

    const storageKey = FileStorage.buildAttachmentKey(
      validatedUserId.id,
      validatedInput.originalName,
    );

    await withServiceSignal(
      this.fileStorage.uploadFile(storageKey, validatedInput.buffer, validatedInput.mimeType),
      ctx,
    );

    const createdAttachment = await this.attachmentRepository.create(
      {
        transactionId: validatedTransactionId.transactionId,
        storageKey,
        mimeType: validatedInput.mimeType,
        originalName: validatedInput.originalName,
      },
      options,
    );

    await this.invalidateTransactionAttachmentCache(
      validatedUserId.id,
      validatedTransactionId.transactionId,
      undefined,
      ctx,
    );

    return toAttachmentResponse(createdAttachment);
  }

  async getPresignedUploadUrl(
    request: PresignedUploadUrlRequestDto,
    transactionId: TransactionIdParamDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PresignedUploadUrlResponseDto> {
    const validatedRequest = parseOrThrow(presignedUploadUrlRequestSchema, request);
    const validatedTransactionId = parseOrThrow(transactionIdParamSchema, transactionId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);

    await this.findOwnedTransaction(validatedTransactionId.transactionId, validatedUserId.id, ctx);

    const storageKey = FileStorage.buildAttachmentKey(
      validatedUserId.id,
      validatedRequest.originalName,
    );
    const expiresInSeconds = env.S3_PRESIGNED_URL_EXPIRY_SECONDS;
    const uploadUrl = await withServiceSignal(
      this.fileStorage.getPresignedUploadUrl(storageKey, expiresInSeconds),
      ctx,
    );

    return presignedUploadUrlResponseSchema.parse({
      storageKey,
      uploadUrl,
      expiresInSeconds,
    });
  }

  async updateAttachment(
    attachment: UpdateAttachmentDto,
    params: AttachmentIdParamDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentResponseDto> {
    const validatedAttachment = parseOrThrow(UpdateAttachmentSchema, attachment);
    const validatedParams = parseOrThrow(attachmentIdParamSchema, params);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);

    await this.findOwnedAttachment(
      validatedParams.transactionId,
      validatedParams.id,
      validatedUserId.id,
      ctx,
    );

    const updatedAttachment = await this.attachmentRepository.update(
      validatedParams.id,
      validatedAttachment,
      options,
    );
    await this.invalidateTransactionAttachmentCache(
      validatedUserId.id,
      validatedParams.transactionId,
      validatedParams.id,
      ctx,
    );
    return toAttachmentResponse(updatedAttachment);
  }

  async deleteAttachment(
    params: AttachmentIdParamDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<DeleteResponseDto> {
    const validatedParams = parseOrThrow(attachmentIdParamSchema, params);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const options = repoOptions(ctx);

    const attachment = await this.findOwnedAttachment(
      validatedParams.transactionId,
      validatedParams.id,
      validatedUserId.id,
      ctx,
    );

    const deletedAttachment = await this.attachmentRepository.softDelete(
      validatedParams.id,
      options,
    );

    await withServiceSignal(this.fileStorage.deleteFile(attachment.storageKey), ctx);

    await this.invalidateTransactionAttachmentCache(
      validatedUserId.id,
      validatedParams.transactionId,
      validatedParams.id,
      ctx,
    );

    return toDeleteResponse(deletedAttachment);
  }

  async getAttachment(
    params: AttachmentIdParamDto,
    userId: IdDto,
    query?: AttachmentDownloadUrlQueryDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentWithDownloadUrlResponseDto> {
    const validatedParams = parseOrThrow(attachmentIdParamSchema, params);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const expiresInSeconds = this.resolveExpiresInSeconds(query);
    const cacheKey = buildAttachmentDownloadCacheKey(
      validatedUserId.id,
      validatedParams.transactionId,
      validatedParams.id,
      expiresInSeconds,
    );

    const cachedAttachment = await withServiceSignal(
      this.cache.getJson<AttachmentWithDownloadUrlResponseDto>(cacheKey),
      ctx,
    );
    if (cachedAttachment) {
      return cachedAttachment;
    }

    const attachment = await this.findOwnedAttachment(
      validatedParams.transactionId,
      validatedParams.id,
      validatedUserId.id,
      ctx,
    );

    const response = await this.withDownloadUrl(attachment, query, ctx);
    await withServiceSignal(
      this.cache.setJson(cacheKey, response, env.ATTACHMENT_DOWNLOAD_URL_CACHE_TTL_SECONDS),
      ctx,
    );
    return response;
  }

  async getAttachmentDownloadUrl(
    params: AttachmentIdParamDto,
    userId: IdDto,
    query?: AttachmentDownloadUrlQueryDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentDownloadUrlResponseDto> {
    const validatedParams = parseOrThrow(attachmentIdParamSchema, params);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const expiresInSeconds = this.resolveExpiresInSeconds(query);
    const cacheKey = `${buildAttachmentDownloadCacheKey(
      validatedUserId.id,
      validatedParams.transactionId,
      validatedParams.id,
      expiresInSeconds,
    )}:url`;

    const cachedUrl = await withServiceSignal(
      this.cache.getJson<AttachmentDownloadUrlResponseDto>(cacheKey),
      ctx,
    );
    if (cachedUrl) {
      return cachedUrl;
    }

    const attachment = await this.findOwnedAttachment(
      validatedParams.transactionId,
      validatedParams.id,
      validatedUserId.id,
      ctx,
    );

    const downloadUrl = await withServiceSignal(
      this.fileStorage.getPresignedDownloadUrl(attachment.storageKey, expiresInSeconds),
      ctx,
    );

    const response = attachmentDownloadUrlResponseSchema.parse({
      downloadUrl,
      expiresInSeconds,
    });
    await withServiceSignal(
      this.cache.setJson(cacheKey, response, env.ATTACHMENT_DOWNLOAD_URL_CACHE_TTL_SECONDS),
      ctx,
    );
    return response;
  }

  async getAttachments(
    transactionId: TransactionIdParamDto,
    userId: IdDto,
    query?: AttachmentDownloadUrlQueryDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentWithDownloadUrlResponseDto[]> {
    const validatedTransactionId = parseOrThrow(transactionIdParamSchema, transactionId);
    const validatedUserId = parseOrThrow(idDtoSchema, userId);
    const expiresInSeconds = this.resolveExpiresInSeconds(query);
    const cacheKey = buildAttachmentListCacheKey(
      validatedUserId.id,
      validatedTransactionId.transactionId,
      expiresInSeconds,
    );

    const cachedAttachments = await withServiceSignal(
      this.cache.getJson<AttachmentWithDownloadUrlResponseDto[]>(cacheKey),
      ctx,
    );
    if (cachedAttachments) {
      return cachedAttachments;
    }

    await this.findOwnedTransaction(validatedTransactionId.transactionId, validatedUserId.id, ctx);

    const attachments = await this.attachmentRepository.findByTransactionId(
      validatedTransactionId.transactionId,
      repoOptions(ctx),
    );

    const result = await Promise.all(
      attachments.map((attachment) => this.withDownloadUrl(attachment, query, ctx)),
    );
    await withServiceSignal(
      this.cache.setJson(cacheKey, result, env.ATTACHMENT_LIST_CACHE_TTL_SECONDS),
      ctx,
    );
    return result;
  }

  private validateUploadInput(input: UploadAttachmentInput): UploadAttachmentInput {
    const validatedMetadata = parseOrThrow(uploadAttachmentSchema, {
      originalName: input.originalName,
      mimeType: input.mimeType,
    });

    if (input.buffer.length === 0) {
      throw validationError("File must not be empty");
    }

    if (input.buffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
      throw validationError(`File size must not exceed ${String(MAX_ATTACHMENT_SIZE_BYTES)} bytes`);
    }

    return {
      ...validatedMetadata,
      buffer: input.buffer,
    };
  }

  private resolveExpiresInSeconds(query?: AttachmentDownloadUrlQueryDto): number {
    const validatedQuery = query
      ? parseOrThrow(attachmentDownloadUrlQuerySchema, query)
      : undefined;
    return validatedQuery?.expiresInSeconds ?? env.S3_PRESIGNED_URL_EXPIRY_SECONDS;
  }

  private async withDownloadUrl(
    attachment: Attachment,
    query?: AttachmentDownloadUrlQueryDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentWithDownloadUrlResponseDto> {
    const expiresInSeconds = this.resolveExpiresInSeconds(query);
    const downloadUrl = await withServiceSignal(
      this.fileStorage.getPresignedDownloadUrl(attachment.storageKey, expiresInSeconds),
      ctx,
    );
    return toAttachmentWithDownloadUrl(attachment, downloadUrl, expiresInSeconds);
  }

  private async invalidateTransactionAttachmentCache(
    userId: string,
    transactionId: string,
    attachmentId?: string,
    ctx?: ServiceContext,
  ): Promise<void> {
    const listKeys = await withServiceSignal(
      this.cache.keys(`${ATTACHMENT_LIST_CACHE_PREFIX}:${userId}:${transactionId}:*`),
      ctx,
    );
    await Promise.all(listKeys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));

    if (attachmentId) {
      const downloadKeys = await withServiceSignal(
        this.cache.keys(
          `${ATTACHMENT_DOWNLOAD_CACHE_PREFIX}:${userId}:${transactionId}:${attachmentId}:*`,
        ),
        ctx,
      );
      await Promise.all(downloadKeys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));
    }
  }

  private async findOwnedTransaction(
    transactionId: string,
    userId: string,
    ctx?: ServiceContext,
  ): Promise<void> {
    const transaction = await this.transactionRepository.findById(transactionId, repoOptions(ctx));
    if (transaction?.userId !== userId) {
      throw notFoundError("TRANSACTION_NOT_FOUND");
    }
  }

  private async findOwnedAttachment(
    transactionId: string,
    attachmentId: string,
    userId: string,
    ctx?: ServiceContext,
  ): Promise<Attachment> {
    await this.findOwnedTransaction(transactionId, userId, ctx);

    const attachment = await this.attachmentRepository.findById(attachmentId, repoOptions(ctx));
    if (attachment?.transactionId !== transactionId) {
      throw notFoundError("ATTACHMENT_NOT_FOUND");
    }
    return attachment;
  }
}
