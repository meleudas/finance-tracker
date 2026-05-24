import {
  AttachmentIdParamDto,
  DeleteResponseDto,
  IdDto,
  TransactionIdParamDto,
} from "../../dtos/common";
import {
  AttachmentDownloadUrlQueryDto,
  AttachmentDownloadUrlResponseDto,
  AttachmentResponseDto,
  AttachmentWithDownloadUrlResponseDto,
  ConfirmPresignedUploadDto,
  PresignedUploadBodyDto,
  PresignedUploadCompleteResponseDto,
  PresignedUploadUrlRequestDto,
  PresignedUploadUrlResponseDto,
  UpdateAttachmentDto,
  UploadAttachmentInput,
} from "../../dtos/attachment";
import type { ServiceContext } from "../serviceContext";

export interface IAttachmentService {
  uploadAttachment(
    input: UploadAttachmentInput,
    transactionId: TransactionIdParamDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentResponseDto>;

  getPresignedUploadUrl(
    request: PresignedUploadUrlRequestDto,
    transactionId: TransactionIdParamDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PresignedUploadUrlResponseDto>;

  confirmPresignedUpload(
    body: ConfirmPresignedUploadDto,
    transactionId: TransactionIdParamDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentResponseDto>;

  uploadPresignedFile(
    body: PresignedUploadBodyDto,
    file: UploadAttachmentInput,
    transactionId: TransactionIdParamDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PresignedUploadCompleteResponseDto>;

  updateAttachment(
    attachment: UpdateAttachmentDto,
    params: AttachmentIdParamDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentResponseDto>;

  deleteAttachment(
    params: AttachmentIdParamDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<DeleteResponseDto>;

  getAttachment(
    params: AttachmentIdParamDto,
    userId: IdDto,
    query?: AttachmentDownloadUrlQueryDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentWithDownloadUrlResponseDto>;

  getAttachmentDownloadUrl(
    params: AttachmentIdParamDto,
    userId: IdDto,
    query?: AttachmentDownloadUrlQueryDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentDownloadUrlResponseDto>;

  getAttachments(
    transactionId: TransactionIdParamDto,
    userId: IdDto,
    query?: AttachmentDownloadUrlQueryDto,
    ctx?: ServiceContext,
  ): Promise<AttachmentWithDownloadUrlResponseDto[]>;
}
